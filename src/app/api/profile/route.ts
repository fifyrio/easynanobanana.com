import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-server';

// Helper function to process referrals
async function processReferral(supabase: any, newUserId: string, referralCode: string) {
  try {
    // Find the referrer by referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      console.error('Referrer not found for code:', referralCode);
      return;
    }

    // Create referral record
    const { error: referralError } = await supabase
      .from('referrals')
      .insert([{
        referrer_id: referrer.id,
        referee_id: newUserId,
        status: 'completed',
        referrer_reward: 30,
        referee_reward: 20,
        completed_at: new Date().toISOString()
      }]);

    if (referralError) {
      console.error('Failed to create referral record:', referralError);
      return;
    }

    // Award referral bonus to new user (referee)
    const { error: refereeCreditError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: newUserId,
        amount: 20,
        transaction_type: 'referral_bonus',
        description: 'Referral bonus for joining through friend invitation'
      }]);

    if (refereeCreditError) {
      console.error('Failed to award referee bonus:', refereeCreditError);
    }

    // Award referral bonus to referrer
    const { error: referrerCreditError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: referrer.id,
        amount: 30,
        transaction_type: 'referral_bonus',
        description: 'Referral bonus for successful friend invitation'
      }]);

    if (referrerCreditError) {
      console.error('Failed to award referrer bonus:', referrerCreditError);
    }

    console.log('Referral processed successfully:', referralCode);
  } catch (error) {
    console.error('Error processing referral:', error);
  }
}

// Create or update user profile
export async function POST(request: Request) {
  try {
    const supabase = createAuthenticatedClient();
    
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
        // Award welcome bonus
        const { error: creditError } = await supabase
          .from('credit_transactions')
          .insert([{
            user_id: user.id,
            amount: 6,
            transaction_type: 'bonus',
            description: 'Welcome bonus for new user'
          }]);

        if (creditError) {
          console.error('Welcome bonus error:', creditError);
          // Don't fail the profile creation for this
        }

        // Process referral if provided
        if (referralCode) {
          await processReferral(supabase, user.id, referralCode);
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
    const supabase = createAuthenticatedClient();
    
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

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error('Profile GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}