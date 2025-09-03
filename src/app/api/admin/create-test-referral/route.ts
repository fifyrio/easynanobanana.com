import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { referrerCode, testUserEmail } = await request.json();
    
    if (!referrerCode || !testUserEmail) {
      return NextResponse.json(
        { error: 'referrerCode and testUserEmail are required' },
        { status: 400 }
      );
    }

    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient();
    
    // Find referrer by referral code
    const { data: referrer, error: referrerError } = await serviceSupabase
      .from('user_profiles')
      .select('id, email, referral_code')
      .eq('referral_code', referrerCode)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Create a test user (simulate new registration)
    const testUserId = crypto.randomUUID();
    
    const { error: userError } = await serviceSupabase
      .from('user_profiles')
      .insert([{
        id: testUserId,
        email: testUserEmail,
        credits: 6, // Default credits
        referred_by: referrer.id
      }]);

    if (userError) {
      console.error('Failed to create test user:', userError);
      return NextResponse.json(
        { error: `Failed to create test user: ${userError.message}` },
        { status: 500 }
      );
    }

    // Create referral record
    const { error: referralError } = await serviceSupabase
      .from('referrals')
      .insert([{
        referrer_id: referrer.id,
        referee_id: testUserId,
        status: 'completed', // Simulate completed registration
        referrer_reward: 30,
        referee_reward: 20,
        completed_at: new Date().toISOString()
      }]);

    if (referralError) {
      console.error('Failed to create referral record:', referralError);
      return NextResponse.json(
        { error: `Failed to create referral record: ${referralError.message}` },
        { status: 500 }
      );
    }

    // Award credits to referrer
    const { error: creditError } = await serviceSupabase
      .from('credit_transactions')
      .insert([{
        user_id: referrer.id,
        amount: 30,
        transaction_type: 'referral',
        description: `Referral reward for inviting ${testUserEmail}`
      }]);

    if (creditError) {
      console.error('Failed to award referral credits:', creditError);
    }

    // Award credits to referee
    const { error: refereeCreditError } = await serviceSupabase
      .from('credit_transactions')
      .insert([{
        user_id: testUserId,
        amount: 20,
        transaction_type: 'referral',
        description: `Welcome bonus for joining via referral`
      }]);

    if (refereeCreditError) {
      console.error('Failed to award referee credits:', refereeCreditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Test referral created successfully',
      referrer: {
        email: referrer.email,
        referralCode: referrer.referral_code,
        creditsAwarded: 30
      },
      referee: {
        email: testUserEmail,
        id: testUserId,
        creditsAwarded: 20
      }
    });

  } catch (error) {
    console.error('Create test referral error:', error);
    return NextResponse.json(
      { error: `Failed to create test referral: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}