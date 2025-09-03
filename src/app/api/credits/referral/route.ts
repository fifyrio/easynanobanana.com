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
    
    // Get user's referral code
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get detailed referral information
    const { data: referrals, error: referralsError } = await serviceSupabase
      .from('referrals')
      .select(`
        id,
        status,
        referrer_reward,
        referee_reward,
        created_at,
        completed_at,
        referee_id,
        user_profiles!referrals_referee_id_fkey(email)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Failed to fetch referrals:', referralsError);
    }

    // Calculate stats
    const totalReferrals = referrals?.length || 0;
    const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
    const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
    const totalEarned = referrals?.reduce((sum, r) => 
      sum + (r.status === 'completed' ? r.referrer_reward : 0), 0) || 0;

    // Format referrals for frontend
    const formattedReferrals = referrals?.map(referral => ({
      id: referral.id,
      email: (referral.user_profiles as any)?.email || 'Unknown',
      status: referral.status,
      reward: referral.referrer_reward,
      createdAt: referral.created_at,
      completedAt: referral.completed_at
    })) || [];

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easynanobanana.com';
    const referralLink = `${baseUrl}/ref/${profile.referral_code}`;

    return NextResponse.json({
      success: true,
      referralCode: profile.referral_code,
      referralLink,
      stats: {
        total: totalReferrals,
        completed: completedReferrals,
        pending: pendingReferrals,
        totalEarned
      },
      referrals: formattedReferrals
    });

  } catch (error) {
    console.error('Referral data fetch error:', error);
    return NextResponse.json(
      { error: `Failed to fetch referral data: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}