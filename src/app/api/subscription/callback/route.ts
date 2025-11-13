import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { createCreemPaymentClient } from '@/lib/payment/creem-client';

/**
 * GET /api/subscription/callback
 * Handles payment success/cancel redirects from Creem.io
 * Verifies payment and allocates subscription credits
 *
 * Query parameters:
 * - order_id: UUID of the order
 * - status: 'success' or 'cancel'
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

  console.log('=== Subscription Callback Started ===', {
    orderId,
    status,
    timestamp: new Date().toISOString()
  });

  if (!orderId) {
    console.error('Missing order_id in callback');
    return NextResponse.redirect(new URL('/pricing?error=missing_order', request.url));
  }

  const serviceSupabase = createServiceClient();

  try {
    // Load order with plan details
    const { data: order, error: orderError } = await serviceSupabase
      .from('orders')
      .select(`
        *,
        payment_plans(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', { orderId, error: orderError });
      return NextResponse.redirect(new URL('/pricing?error=order_not_found', request.url));
    }

    console.log('Order loaded:', {
      orderId: order.id,
      status: order.status,
      planName: order.payment_plans?.name,
      userId: order.user_id
    });

    // Handle user cancellation
    if (status === 'cancel') {
      console.log('User cancelled payment');
      await serviceSupabase
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return NextResponse.redirect(new URL('/pricing?cancelled=true', request.url));
    }

    // Check if already completed (idempotency)
    if (order.status === 'completed') {
      console.log('Order already completed, skipping processing (idempotent)');
      return NextResponse.redirect(new URL('/billing?subscribed=true', request.url));
    }

    // Verify payment with Creem.io
    console.log('Verifying payment with Creem.io:', order.external_order_id);
    const creemClient = createCreemPaymentClient();
    const checkoutStatus = await creemClient.getCheckoutStatus(order.external_order_id);

    console.log('Creem.io checkout status:', {
      status: checkoutStatus.status,
      checkoutId: order.external_order_id
    });

    if (checkoutStatus.status !== 'completed' && checkoutStatus.status !== 'paid') {
      console.error('Payment not completed:', { status: checkoutStatus.status });
      return NextResponse.redirect(new URL('/pricing?error=payment_pending', request.url));
    }

    // Process subscription
    const plan = order.payment_plans;
    if (!plan) {
      console.error('Plan data missing from order');
      return NextResponse.redirect(new URL('/pricing?error=plan_not_found', request.url));
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.duration_months || 1));

    console.log('Creating subscription:', {
      userId: order.user_id,
      planId: plan.id,
      periodStart: now.toISOString(),
      periodEnd: periodEnd.toISOString(),
      credits: plan.credits
    });

    // 1. Create subscription record
    const { data: subscription, error: subError } = await serviceSupabase
      .from('subscriptions')
      .insert({
        user_id: order.user_id,
        plan_id: plan.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        credits_included: plan.credits,
        external_subscription_id: order.external_order_id,
        cancel_at_period_end: false
      })
      .select()
      .single();

    if (subError) {
      console.error('Failed to create subscription:', subError);
      throw new Error(`Subscription creation failed: ${subError.message}`);
    }

    console.log('Subscription created:', { subscriptionId: subscription.id });

    // 2. Allocate credits via transaction
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
      console.error('Failed to allocate credits:', creditError);
      throw new Error(`Credit allocation failed: ${creditError.message}`);
    }

    console.log('Credits allocated:', { amount: plan.credits });

    // 3. Update user profile with subscription info
    const { error: profileError } = await serviceSupabase
      .from('user_profiles')
      .update({
        active_plan_id: plan.id,
        subscription_expires_at: periodEnd.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', order.user_id);

    if (profileError) {
      console.error('Failed to update user profile:', profileError);
      // Non-fatal, continue
    }

    // 4. Update order with subscription reference
    await serviceSupabase
      .from('orders')
      .update({
        status: 'completed',
        subscription_id: subscription.id,
        updated_at: now.toISOString()
      })
      .eq('id', orderId);

    console.log('=== Subscription Created Successfully ===', {
      subscriptionId: subscription.id,
      userId: order.user_id,
      planName: plan.name,
      credits: plan.credits,
      expiresAt: periodEnd.toISOString()
    });

    // Redirect to billing page with success message
    return NextResponse.redirect(new URL('/billing?subscribed=true', request.url));

  } catch (error) {
    console.error('=== CRITICAL ERROR in subscription callback ===', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderId
    });

    // Update order status to failed
    try {
      await serviceSupabase
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    } catch (updateError) {
      console.error('Failed to update order status:', updateError);
    }

    return NextResponse.redirect(new URL('/pricing?error=processing_failed', request.url));
  }
}
