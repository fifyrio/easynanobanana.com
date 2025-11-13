import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';
import { createCreemPaymentClient } from '@/lib/payment/creem-client';

/**
 * POST /api/subscription/create-checkout
 * Creates a subscription checkout session with Creem.io
 *
 * Request body:
 * - plan_id: UUID of the subscription plan
 *
 * Returns:
 * - payment_url: URL to redirect user for payment
 * - order_id: UUID of the created order
 * - checkout_id: Creem.io checkout session ID
 */
export async function POST(request: NextRequest) {
  try {
    const { plan_id } = await request.json();

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

    // Check if user already has an active subscription
    const { data: existingSubscription } = await serviceSupabase
      .from('subscriptions')
      .select('id, status, payment_plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

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

    console.log('Plan found:', { planName: plan.name, price: plan.price, credits: plan.credits });
    console.log('Plan details from database:', JSON.stringify(plan, null, 2));

    // Create pending order
    const { data: order, error: orderError } = await serviceSupabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending',
        credits_awarded: plan.credits,
        payment_method: 'creem'
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    console.log('Order created:', { orderId: order.id });

    // Map plan names to Creem.io product IDs
    const productIdMap: Record<string, string> = {
      'Basic Monthly': process.env.CREEM_TEST_BASIC_PRODUCT_ID || '',
      'Pro Monthly': process.env.CREEM_TEST_PRO_PRODUCT_ID || '',
      'Max Monthly': process.env.CREEM_TEST_MAX_PRODUCT_ID || ''
    };

    console.log('Product ID mapping:', productIdMap);
    console.log('Looking up product ID for plan name:', plan.name);

    const creemProductId = productIdMap[plan.name];
    if (!creemProductId) {
      console.error('Product ID not configured for plan:', plan.name);
      console.error('Available plan names in map:', Object.keys(productIdMap));
      return NextResponse.json({ error: 'Product configuration error' }, { status: 500 });
    }

    console.log('Using Creem product ID:', creemProductId);

    // Create Creem checkout session
    const creemClient = createCreemPaymentClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const checkoutResponse = await creemClient.createCheckoutWithOptions(creemProductId, {
      requestId: order.id,
      successUrl: `${baseUrl}/api/subscription/callback?order_id=${order.id}&status=success`,
      userEmail: user.email,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        type: 'subscription'
      }
      // Note: planType is not sent to Creem API - it's stored in metadata instead
    });

    console.log('Creem checkout created:', {
      checkoutId: checkoutResponse.checkout_id,
      paymentUrl: checkoutResponse.payment_url
    });

    // Update order with Creem checkout ID
    await serviceSupabase
      .from('orders')
      .update({
        external_order_id: checkoutResponse.checkout_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      payment_url: checkoutResponse.payment_url,
      order_id: order.id,
      checkout_id: checkoutResponse.checkout_id
    });

  } catch (error) {
    console.error('Subscription checkout creation failed:', error);
    return NextResponse.json(
      { error: `Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
