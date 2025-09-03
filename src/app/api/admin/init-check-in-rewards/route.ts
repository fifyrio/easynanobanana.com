import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient();
    
    // Insert check-in rewards data
    const rewardsData = [
      { day: 1, credits: 1, is_bonus_day: false },
      { day: 2, credits: 1, is_bonus_day: false },
      { day: 3, credits: 2, is_bonus_day: false },
      { day: 4, credits: 3, is_bonus_day: true },
      { day: 5, credits: 2, is_bonus_day: false },
      { day: 6, credits: 3, is_bonus_day: false },
      { day: 7, credits: 5, is_bonus_day: true },
    ];

    const { error } = await serviceSupabase
      .from('check_in_rewards')
      .upsert(rewardsData, { onConflict: 'day' });

    if (error) {
      console.error('Failed to initialize check-in rewards:', error);
      return NextResponse.json(
        { error: `Failed to initialize check-in rewards: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in rewards initialized successfully',
      rewards: rewardsData
    });

  } catch (error) {
    console.error('Init check-in rewards error:', error);
    return NextResponse.json(
      { error: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}