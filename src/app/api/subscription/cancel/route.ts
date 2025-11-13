import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * POST /api/subscription/cancel
 * Cancels subscription at period end (user keeps access until expiration)
 *
 * Request body: none required
 *
 * Returns:
 * - success: boolean
 * - message: string
 * - expiresAt: ISO date string when access ends
 */
export async function POST(request: NextRequest) {
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

    // Get active subscription
    const { data: subscription, error: subError } = await serviceSupabase
      .from('subscriptions')
      .select(`
        *,
        payment_plans(name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      console.error('No active subscription found:', subError);
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Check if already scheduled for cancellation
    if (subscription.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        message: 'Subscription is already scheduled for cancellation',
        expiresAt: subscription.current_period_end
      });
    }

    console.log('Cancelling subscription:', {
      subscriptionId: subscription.id,
      userId: user.id,
      planName: subscription.payment_plans?.name,
      expiresAt: subscription.current_period_end
    });

    // Mark subscription for cancellation at period end
    const { error: updateError } = await serviceSupabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to cancel subscription:', updateError);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    console.log('Subscription cancelled successfully:', {
      subscriptionId: subscription.id,
      accessUntil: subscription.current_period_end
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at period end. You will keep access until then.',
      expiresAt: subscription.current_period_end,
      planName: subscription.payment_plans?.name
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: `Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
