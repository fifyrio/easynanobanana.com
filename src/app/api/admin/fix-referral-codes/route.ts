import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

// Generate a user-friendly referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient();
    
    // Get all users with UUID-style referral codes
    const { data: users, error: fetchError } = await serviceSupabase
      .from('user_profiles')
      .select('id, referral_code, email')
      .like('referral_code', '%-%-%-%-%'); // UUID format detection

    if (fetchError) {
      console.error('Failed to fetch users:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch users: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No UUID-style referral codes found to update',
        updated: 0
      });
    }

    const updates = [];
    const usedCodes = new Set<string>();

    // Generate unique short codes for each user
    for (const user of users) {
      let newCode = generateReferralCode();
      
      // Ensure uniqueness
      while (usedCodes.has(newCode)) {
        newCode = generateReferralCode();
      }
      usedCodes.add(newCode);

      updates.push({
        id: user.id,
        oldCode: user.referral_code,
        newCode,
        email: user.email
      });

      // Update the user's referral code
      const { error: updateError } = await serviceSupabase
        .from('user_profiles')
        .update({ referral_code: newCode })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Failed to update user ${user.id}:`, updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} referral codes from UUID format to short codes`,
      updates: updates.map(u => ({
        email: u.email,
        oldCode: u.oldCode.substring(0, 8) + '...',
        newCode: u.newCode
      }))
    });

  } catch (error) {
    console.error('Fix referral codes error:', error);
    return NextResponse.json(
      { error: `Failed to fix referral codes: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}