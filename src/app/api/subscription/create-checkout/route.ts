import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';
import { createWaffoClient } from '@/lib/payment/waffo-client';
import { getPaymentConfig } from '@/lib/payment/config';
import { getActiveSubscription } from '@/lib/payment/subscription-status';
import { PAID_VIDEO_TRIALS } from '@/lib/payment/paid-trial';

/**
 * POST /api/subscription/create-checkout
 * Creates a subscription checkout session with Waffo Pancake
 *
 * Request body:
 * - plan_id: UUID of the subscription plan
 *
 * Returns:
 * - payment_url: URL to redirect user for payment
 * - order_id: UUID of the created order
 * - checkout_id: Waffo checkout session ID
 */
export async function POST(request: NextRequest) {
  try {
    const { plan_id, with_trial = false } = await request.json();
    if (typeof with_trial !== 'boolean') {
      return NextResponse.json({ error: 'with_trial must be a boolean' }, { status: 400 });
    }

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Get authorization token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Initialize Supabase client and verify auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
    }

    console.log('Creating checkout for user:', { userId: user.id, email: user.email, planId: plan_id });

    // Use service client for database operations
    const serviceSupabase = createServiceClient();

    // Block only when a still-valid (non-expired) subscription exists. Expired
    // subscriptions are lazily flipped to 'expired' and do not block switching.
    const existingSubscription = await getActiveSubscription(
      serviceSupabase,
      user.id,
      'id, status, current_period_end, payment_plans(name)'
    );

    if (existingSubscription) {
      const planData = existingSubscription.payment_plans as any;
      const planName = Array.isArray(planData) ? planData[0]?.name : planData?.name;
      return NextResponse.json({
        error: `You already have an active ${planName || 'subscription'}. Please cancel it first to switch plans.`
      }, { status: 400 });
    }

    // Get plan details
    const { data: plan, error: planError } = await serviceSupabase
      .from('payment_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('plan_type', 'subscription')
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 404 });
    }

    const trial = with_trial ? PAID_VIDEO_TRIALS[plan.name] : undefined;
    if (with_trial && !trial) {
      return NextResponse.json({ error: 'This plan has no paid trial' }, { status: 400 });
    }
    if (trial) {
      const { data: usedTrial, error } = await serviceSupabase.from('paid_video_trials')
        .select('user_id').eq('user_id', user.id).maybeSingle();
      if (error) throw new Error('Paid trial fulfillment is not configured yet');
      if (usedTrial) {
        return NextResponse.json({ error: 'You have already used your paid video trial. Please subscribe without a trial.' }, { status: 409 });
      }
    }

    console.log('Plan found:', { planName: plan.name, price: plan.price, credits: plan.credits });
    console.log('Plan details from database:', JSON.stringify(plan, null, 2));

    // Get payment config based on PAYMENT_ENV
    const paymentConfig = getPaymentConfig();

    // Map plan names to Waffo product IDs (dynamically based on environment)
    const productIdMap: Record<string, string> = {
      'Basic Monthly': paymentConfig.basicProductId,
      'Pro Monthly': paymentConfig.proProductId,
      'Max Monthly': paymentConfig.maxProductId
    };

    console.log('Payment environment:', process.env.PAYMENT_ENV);
    console.log('Looking up product ID for plan name:', plan.name);

    const waffoProductId = productIdMap[plan.name];
    if (!waffoProductId) {
      console.error('Product ID not configured for plan:', plan.name);
      console.error('Available plan names in map:', Object.keys(productIdMap));
      return NextResponse.json({ error: 'Product configuration error' }, { status: 500 });
    }

    console.log('Using Waffo product ID:', waffoProductId);

    // Create Waffo checkout session (authenticated — buyer identity tied to user)
    const waffoClient = createWaffoClient();
    if (trial) {
      const { data, errors } = await waffoClient.graphql.query<{
        subscriptionProductVersions: Array<{ isProdVersion: boolean; isTestVersion: boolean; metadata: string; prices: Array<{ currency: string; priceInfo: { amount: string; trialAmount?: string } }> }>;
      }>({
        query: `query($id: String!) { subscriptionProductVersions(productId: $id) {
          isProdVersion isTestVersion metadata prices { currency priceInfo { amount trialAmount } }
        } }`,
        variables: { id: waffoProductId },
      });
      const version = data?.subscriptionProductVersions.find((v) => process.env.PAYMENT_ENV === 'production' ? v.isProdVersion : v.isTestVersion);
      const price = version?.prices.find((p) => p.currency === 'USD')?.priceInfo;
      if (errors?.length || !version || Number(price?.trialAmount) !== trial.price ||
        Number(price?.amount) !== Number(plan.price) || JSON.parse(version.metadata).trialDays !== trial.days) {
        throw new Error('Paid trial checkout configuration does not match the offer');
      }
    }
    // Create pending order
    const { data: order, error: orderError } = await serviceSupabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: trial?.price ?? plan.price,
        currency: plan.currency,
        status: 'pending',
        credits_awarded: trial?.credits ?? plan.credits,
        payment_method: 'waffo'
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    console.log('Order created:', { orderId: order.id });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const checkoutResult = await waffoClient.checkout.authenticated.create({
      productId: waffoProductId,
      currency: plan.currency || 'USD',
      buyerIdentity: user.id,
      buyerEmail: user.email,
      // Let Waffo enforce first-trial/shared-group eligibility; true would force it.
      withTrial: with_trial ? undefined : false,
      successUrl: `${baseUrl}/api/subscription/callback?order_id=${order.id}&status=success`,
      // order.id echoes back on every webhook for reconciliation
      orderMerchantExternalId: order.id,
      metadata: {
        order_id: String(order.id),
        user_id: String(user.id),
        plan_id: String(plan.id),
        plan_name: String(plan.name),
        type: 'subscription'
      }
    });

    console.log('Waffo checkout created:', {
      sessionId: checkoutResult.sessionId,
      checkoutUrl: checkoutResult.checkoutUrl
    });

    // Update order with Waffo session ID
    await serviceSupabase
      .from('orders')
      .update({
        external_order_id: checkoutResult.sessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      payment_url: checkoutResult.checkoutUrl,
      order_id: order.id,
      checkout_id: checkoutResult.sessionId
    });

  } catch (error) {
    console.error('Subscription checkout creation failed:', error);
    return NextResponse.json(
      { error: `Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
