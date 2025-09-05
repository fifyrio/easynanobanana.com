import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

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

    // Initialize Supabase client and set auth
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use service client for database operations to bypass RLS
    const serviceSupabase = createServiceClient();
    
    // Get user profile with credits and referral info
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('credits, referral_code, last_check_in, consecutive_check_ins')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('User profile not found for user:', user.id);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get recent credit transactions for activity feed
    const { data: transactions, error: transactionsError } = await serviceSupabase
      .from('credit_transactions')
      .select('id, amount, transaction_type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('Failed to fetch credit transactions:', transactionsError);
    }

    // Get referral stats with friend information
    const { data: referralStats } = await serviceSupabase
      .from('referrals')
      .select(`
        id,
        status,
        referrer_reward,
        referee_reward,
        created_at,
        completed_at,
        referee_id,
        user_profiles!referrals_referee_id_fkey(email, first_name, last_name)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    // Check daily check-in status
    const today = new Date().toISOString().split('T')[0];
    const canCheckIn = profile.last_check_in !== today;

    // Get total earned credits from referral transactions (more accurate than calculating from referrals table)
    const { data: referralTransactions } = await serviceSupabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('transaction_type', 'referral');
    
    const totalEarnedFromReferrals = referralTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/ref/${profile.referral_code}`;

    // Format referrals for frontend
    const formattedReferrals = referralStats?.map(referral => {
      const referee = referral.user_profiles as any;
      const refereeName = referee?.first_name && referee?.last_name 
        ? `${referee.first_name} ${referee.last_name}`
        : referee?.first_name 
        ? referee.first_name
        : referee?.email?.split('@')[0] || 'Unknown';
      
      // Calculate earned credits for this specific referral
      // 10 credits for signup (immediate), 30 credits for purchase (when completed)
      const earnedCredits = referral.status === 'completed' ? 40 : 10; // 10 signup + 30 purchase = 40 total when completed
      
      return {
        id: referral.id,
        email: referee?.email || 'Unknown',
        name: refereeName,
        status: referral.status,
        reward: earnedCredits,
        createdAt: referral.created_at,
        completedAt: referral.completed_at
      };
    }) || [];

    return NextResponse.json({
      success: true,
      credits: profile.credits,
      referralCode: profile.referral_code,
      referralLink,
      lastCheckIn: profile.last_check_in,
      consecutiveCheckIns: profile.consecutive_check_ins,
      canCheckIn,
      recentTransactions: transactions || [],
      referralStats: {
        total: referralStats?.length || 0,
        completed: referralStats?.filter(r => r.status === 'completed').length || 0,
        pending: referralStats?.filter(r => r.status === 'pending').length || 0,
        totalEarned: totalEarnedFromReferrals,
        referrals: formattedReferrals
      }
    });

  } catch (error) {
    console.error('Credit balance fetch error:', error);
    return NextResponse.json(
      { error: `Failed to fetch credit balance: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}