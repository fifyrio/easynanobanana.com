import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook, WebhookEventType, type WebhookEvent } from '@waffo/pancake-ts';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * POST /api/subscription/webhook
 * Waffo Pancake webhook receiver. Verifies the signature, then fulfills
 * subscription orders (grants credits, creates subscription rows) and handles
 * cancellations. This is the source of truth for payment fulfillment.
 *
 * CRITICAL: read the raw body with request.text() — parsing JSON first breaks
 * signature verification.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-waffo-signature');

  let event: WebhookEvent;
  try {
    // Test/prod public key resolves automatically from event mode.
    event = verifyWebhook(body, signature);
  } catch (error) {
    console.error('Waffo webhook signature verification failed:', error);
    return new NextResponse('Invalid signature', { status: 401 });
  }

  console.log('Waffo webhook received:', {
    id: event.id,
    eventType: event.eventType,
    mode: event.mode,
    orderMerchantExternalId: event.data.orderMerchantExternalId
  });

  try {
    switch (event.eventType) {
      case WebhookEventType.OrderCompleted:
      case WebhookEventType.SubscriptionActivated:
        await fulfillSubscription(event);
        break;
      case WebhookEventType.SubscriptionCanceled:
        await cancelSubscription(event);
        break;
      default:
        console.log('Waffo webhook: unhandled event type', event.eventType);
    }
  } catch (error) {
    console.error('Waffo webhook processing error:', error);
    // Still return 200 so Waffo does not retry a poison event indefinitely;
    // failures are logged for manual reconciliation.
  }

  return new NextResponse('OK', { status: 200 });
}

/** Resolve our internal order id from the event payload. */
function resolveOrderId(event: WebhookEvent): string | null {
  return (
    event.data.orderMerchantExternalId ||
    event.data.orderMetadata?.order_id ||
    null
  );
}

async function fulfillSubscription(event: WebhookEvent): Promise<void> {
  const orderId = resolveOrderId(event);
  if (!orderId) {
    console.error('Waffo webhook: no order id on event', event.id);
    return;
  }

  const serviceSupabase = createServiceClient();

  const { data: order, error: orderError } = await serviceSupabase
    .from('orders')
    .select(`*, payment_plans(*)`)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Waffo webhook: order not found', { orderId, orderError });
    return;
  }

  // Idempotency — already fulfilled
  if (order.status === 'completed') {
    console.log('Waffo webhook: order already completed, skipping', orderId);
    return;
  }

  const plan = order.payment_plans;
  if (!plan) {
    console.error('Waffo webhook: plan missing on order', orderId);
    return;
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (plan.duration_months || 1));

  // Waffo subscription/order id for future renewal + cancellation matching
  const waffoOrderId = event.data.orderId;

  // 1. Subscription record
  const { data: subscription, error: subError } = await serviceSupabase
    .from('subscriptions')
    .insert({
      user_id: order.user_id,
      plan_id: plan.id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      credits_included: plan.credits,
      external_subscription_id: waffoOrderId,
      cancel_at_period_end: false
    })
    .select()
    .single();

  if (subError) {
    throw new Error(`Subscription creation failed: ${subError.message}`);
  }

  // 2. Allocate credits
  const { error: creditError } = await serviceSupabase
    .from('credit_transactions')
    .insert({
      user_id: order.user_id,
      amount: plan.credits,
      transaction_type: 'purchase',
      description: `${plan.name} subscription - ${plan.credits} credits`,
      order_id: order.id
    });

  if (creditError) {
    throw new Error(`Credit allocation failed: ${creditError.message}`);
  }

  // 3. Update user profile
  const { error: profileError } = await serviceSupabase
    .from('user_profiles')
    .update({
      active_plan_id: plan.id,
      subscription_expires_at: periodEnd.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', order.user_id);

  if (profileError) {
    console.error('Waffo webhook: profile update failed (non-fatal)', profileError);
  }

  // 4. Mark order completed
  await serviceSupabase
    .from('orders')
    .update({
      status: 'completed',
      subscription_id: subscription.id,
      external_order_id: waffoOrderId,
      updated_at: now.toISOString()
    })
    .eq('id', order.id);

  console.log('Waffo webhook: subscription fulfilled', {
    orderId,
    subscriptionId: subscription.id,
    credits: plan.credits
  });
}

async function cancelSubscription(event: WebhookEvent): Promise<void> {
  const waffoOrderId = event.data.orderId;
  if (!waffoOrderId) return;

  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('external_subscription_id', waffoOrderId)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Subscription cancellation failed: ${error.message}`);
  }

  console.log('Waffo webhook: subscription cancelled', { waffoOrderId });
}
