import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient();
    
    // Get existing users to create referral relationships between them
    const { data: users, error: usersError } = await serviceSupabase
      .from('user_profiles')
      .select('id, email, referral_code')
      .limit(2);

    if (usersError || !users || users.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 users in database to create demo referral data' },
        { status: 400 }
      );
    }

    const [referrer, referee] = users;

    // Check if referral already exists
    const { data: existingReferral } = await serviceSupabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referee_id', referee.id)
      .single();

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        message: 'Demo referral data already exists',
        referral: {
          referrer: referrer.email,
          referee: referee.email,
          status: 'already_exists'
        }
      });
    }

    // Create referral record
    const { error: referralError } = await serviceSupabase
      .from('referrals')
      .insert([{
        referrer_id: referrer.id,
        referee_id: referee.id,
        status: 'completed',
        referrer_reward: 30,
        referee_reward: 20,
        completed_at: new Date().toISOString()
      }]);

    if (referralError) {
      console.error('Failed to create demo referral:', referralError);
      return NextResponse.json(
        { error: `Failed to create demo referral: ${referralError.message}` },
        { status: 500 }
      );
    }

    // Create credit transactions for the referral
    const transactions = [
      {
        user_id: referrer.id,
        amount: 30,
        transaction_type: 'referral',
        description: `Referral reward for inviting ${referee.email}`
      },
      {
        user_id: referee.id,
        amount: 20,
        transaction_type: 'referral',
        description: `Welcome bonus for joining via referral from ${referrer.email}`
      }
    ];

    const { error: transactionError } = await serviceSupabase
      .from('credit_transactions')
      .insert(transactions);

    if (transactionError) {
      console.error('Failed to create referral transactions:', transactionError);
    }

    return NextResponse.json({
      success: true,
      message: 'Demo referral data created successfully',
      referral: {
        referrer: {
          email: referrer.email,
          referralCode: referrer.referral_code,
          creditsAwarded: 30
        },
        referee: {
          email: referee.email,
          creditsAwarded: 20
        },
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Create demo referral error:', error);
    return NextResponse.json(
      { error: `Failed to create demo referral: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}