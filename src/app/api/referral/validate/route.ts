import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('code');

    if (!referralCode) {
      return NextResponse.json(
        { valid: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient();

    // Find user with this referral code
    const { data: referrer, error } = await serviceSupabase
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('referral_code', referralCode)
      .single();

    if (error || !referrer) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Create referrer name (prefer first name + last name, fallback to email)
    const referrerName = referrer.first_name && referrer.last_name
      ? `${referrer.first_name} ${referrer.last_name}`
      : referrer.first_name
      ? referrer.first_name
      : referrer.email.split('@')[0]; // Use email username as fallback

    return NextResponse.json({
      valid: true,
      referrerName,
      referrerId: referrer.id
    });

  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}