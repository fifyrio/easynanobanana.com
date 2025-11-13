import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/subscription/status
 * Gets current subscription status for authenticated user
 *
 * Returns:
 * - hasSubscription: boolean
 * - subscription: object with subscription details or null
 */
export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();

    // Get active subscription with plan details
    const { data: subscription, error: subError } = await serviceSupabase
      .from('subscriptions')
      .select(`
        *,
        payment_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Subscription fetch error:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // No active subscription
    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    // Calculate days remaining
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Get user's current credit balance
    const { data: profile } = await serviceSupabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        planId: subscription.plan_id,
        planName: subscription.payment_plans.name,
        creditsIncluded: subscription.credits_included,
        creditsRemaining: profile?.credits || 0,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        daysRemaining,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelledAt: subscription.cancelled_at,
        price: subscription.payment_plans.price,
        currency: subscription.payment_plans.currency
      }
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: `Failed to fetch status: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
