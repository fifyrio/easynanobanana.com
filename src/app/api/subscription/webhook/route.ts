import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook, WebhookEventType, type WebhookEvent } from '@waffo/pancake-ts';
import { createServiceClient } from '@/lib/supabase-server';
import { fulfillSubscriptionPayment } from '@/lib/payment/fulfill-payment';
import { getPaymentEnvironment } from '@/lib/payment/config';

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

  if (event.mode !== (getPaymentEnvironment() === 'production' ? 'prod' : 'test')) {
    return new NextResponse('Wrong payment environment', { status: 400 });
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
      case WebhookEventType.SubscriptionPaymentSucceeded:
        await fulfillSubscriptionPayment(event);
        break;
      case WebhookEventType.SubscriptionCanceled:
        await cancelSubscription(event);
        break;
      default:
        console.log('Waffo webhook: unhandled event type', event.eventType);
    }
  } catch (error) {
    console.error('Waffo webhook processing error:', error);
    return new NextResponse('Payment fulfillment failed', { status: 500 });
  }

  return new NextResponse('OK', { status: 200 });
}

async function cancelSubscription(event: WebhookEvent): Promise<void> {
  const waffoOrderId = event.data.orderId;
  if (!waffoOrderId) return;

  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancelled_at: new Date().toISOString()
    })
    .eq('external_subscription_id', waffoOrderId)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Subscription cancellation failed: ${error.message}`);
  }

  const { data: subscription } = await serviceSupabase.from('subscriptions').select('id')
    .eq('external_subscription_id', waffoOrderId).maybeSingle();
  if (subscription) {
    const { error: trialError } = await serviceSupabase.from('paid_video_trials')
      .update({ remaining_credits: 0 }).eq('subscription_id', subscription.id);
    if (trialError) throw new Error(trialError.message);
  }

  console.log('Waffo webhook: subscription cancelled', { waffoOrderId });
}
