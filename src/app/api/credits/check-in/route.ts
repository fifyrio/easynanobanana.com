import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

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

    // Initialize Supabase client and set auth
    const supabase = await createAuthenticatedClient();
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
    
    // Get user profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('credits, last_check_in, consecutive_check_ins')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('User profile not found for user:', user.id);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user already checked in today
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_check_in === today) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 409 }
      );
    }

    // Calculate consecutive days and reward
    const lastCheckIn = profile.last_check_in ? new Date(profile.last_check_in) : null;
    const todayDate = new Date(today);
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newConsecutiveDays = 1;
    if (lastCheckIn && lastCheckIn.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      newConsecutiveDays = (profile.consecutive_check_ins || 0) + 1;
    }

    // Get reward from check_in_rewards table
    const { data: rewardConfig, error: rewardError } = await serviceSupabase
      .from('check_in_rewards')
      .select('credits, is_bonus_day')
      .eq('day', Math.min(newConsecutiveDays, 7))
      .single();

    // Default to 1 credit if no specific reward configured
    const creditsToAward = rewardConfig?.credits || 1;
    const isBonusDay = rewardConfig?.is_bonus_day || false;

    // Update user profile with new check-in data
    const { error: updateError } = await serviceSupabase
      .from('user_profiles')
      .update({
        last_check_in: today,
        consecutive_check_ins: newConsecutiveDays,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update check-in status' },
        { status: 500 }
      );
    }

    // Create credit transaction
    const { error: transactionError } = await serviceSupabase
      .from('credit_transactions')
      .insert([{
        user_id: user.id,
        amount: creditsToAward,
        transaction_type: 'check_in',
        description: `Daily check-in reward (Day ${newConsecutiveDays}${isBonusDay ? ' - Bonus!' : ''})`
      }]);

    if (transactionError) {
      console.error('Failed to create credit transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to award check-in credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creditsAwarded: creditsToAward,
      consecutiveDays: newConsecutiveDays,
      isBonusDay,
      newBalance: profile.credits + creditsToAward,
      message: `Check-in successful! Earned ${creditsToAward} credit${creditsToAward > 1 ? 's' : ''}${isBonusDay ? ' (Bonus day!)' : ''}`
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: `Check-in failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
