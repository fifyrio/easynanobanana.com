import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-server';
import { CachePresets, buildCacheHeader } from '@/lib/cache-headers';

// Helper function to process referrals
async function processReferral(supabase: any, newUserId: string, referralCode: string): Promise<boolean> {
  try {
    // Find the referrer by referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('user_profiles')
      .select('id, credits')
      .eq('referral_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      console.error('Referrer not found for code:', referralCode);
      return false;
    }

    // Referrer gets 30 credits (as requested by user)
    const REFERRER_REWARD = 30;

    // Create referral record
    const { error: referralError } = await supabase
      .from('referrals')
      .insert([{
        referrer_id: referrer.id,
        referee_id: newUserId,
        status: 'completed',
        referrer_reward: REFERRER_REWARD,
        referee_reward: 4, // The extra 4 credits we give to make total 12
        completed_at: new Date().toISOString()
      }]);

    if (referralError) {
      console.error('Failed to create referral record:', referralError);
      return false;
    }

    // Award referral bonus to referrer and update their credits
    const { error: referrerCreditError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: referrer.id,
        amount: REFERRER_REWARD,
        transaction_type: 'referral',
        description: 'Referral bonus for successful friend invitation'
      }]);

    if (referrerCreditError) {
      console.error('Failed to award referrer bonus:', referrerCreditError);
      return false;
    }

    // Update referrer's credits field
    const { error: referrerUpdateError } = await supabase
      .from('user_profiles')
      .update({ credits: referrer.credits + REFERRER_REWARD })
      .eq('id', referrer.id);

    if (referrerUpdateError) {
      console.error('Failed to update referrer credits:', referrerUpdateError);
    }

    console.log('Referral processed successfully:', referralCode, 'Referrer awarded:', REFERRER_REWARD);
    return true;
  } catch (error) {
    console.error('Error processing referral:', error);
    return false;
  }
}

// Create or update user profile
export async function POST(request: Request) {
  try {
    const supabase = await createAuthenticatedClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body to get referral code if provided
    let referralCode: string | null = null;
    try {
      const body = await request.json();
      referralCode = body.referralCode || null;
    } catch {
      // Body is optional, ignore parsing errors
    }

    // Extract user data
    const userData = {
      id: user.id,
      email: user.email!,
      first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
      last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    };

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      return NextResponse.json({ profile: data, created: false });
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      // Award welcome bonus and process referral if profile was created successfully
      if (data) {
        const WELCOME_BONUS = 2; // Welcome bonus
        let totalCredits = 6 + WELCOME_BONUS; // Default: 6 + 2 = 8 credits
        let transactions = [{
          user_id: user.id,
          amount: WELCOME_BONUS,
          transaction_type: 'bonus',
          description: 'Welcome bonus for new user'
        }];

        // Process referral if provided - this changes the base amount for referred users
        if (referralCode) {
          // For referred users: total should be 12 (10 base + 2 welcome)
          // So we need to add 4 more credits to reach the target of 12
          const REFERRAL_BASE_BONUS = 4; // To make total 12 instead of 8
          totalCredits = 10 + WELCOME_BONUS; // 12 total for referred users
          
          transactions.push({
            user_id: user.id,
            amount: REFERRAL_BASE_BONUS,
            transaction_type: 'referral',
            description: 'Extra credits for joining through friend invitation'
          });

          // Process the referral (awards referrer 50 credits)
          await processReferral(supabase, user.id, referralCode);
        }

        // Insert all credit transactions
        const { error: creditError } = await supabase
          .from('credit_transactions')
          .insert(transactions);

        if (creditError) {
          console.error('Credit transaction error:', creditError);
        }

        // Update user's total credits field
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ credits: totalCredits })
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to update user credits:', updateError);
        }
      }

      return NextResponse.json({ profile: data, created: true });
    }
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user profile
export async function GET(request: Request) {
  try {
    const supabase = await createAuthenticatedClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: profile || null }, {
      headers: {
        'Cache-Control': buildCacheHeader(CachePresets.SHORT_PRIVATE),
      },
    });
  } catch (error) {
    console.error('Profile GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
