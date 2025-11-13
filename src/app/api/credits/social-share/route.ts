import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { platform, content } = await request.json();
    
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

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
    
    // Check if user already got social share reward today
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysShares, error: shareCheckError } = await serviceSupabase
      .from('credit_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'bonus')
      .like('description', '%social share%')
      .gte('created_at', today + 'T00:00:00.000Z')
      .limit(1);

    if (shareCheckError) {
      console.error('Failed to check social share history:', shareCheckError);
    }

    if (todaysShares && todaysShares.length > 0) {
      return NextResponse.json(
        { error: 'Social share bonus already claimed today' },
        { status: 409 }
      );
    }

    const creditsToAward = 2; // 2 credits for social sharing

    // Create credit transaction
    const { error: transactionError } = await serviceSupabase
      .from('credit_transactions')
      .insert([{
        user_id: user.id,
        amount: creditsToAward,
        transaction_type: 'bonus',
        description: `Social share reward (${platform})`
      }]);

    if (transactionError) {
      console.error('Failed to create credit transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to award social share credits' },
        { status: 500 }
      );
    }

    // Log social share activity
    const { error: activityError } = await serviceSupabase
      .from('user_activity')
      .insert([{
        user_id: user.id,
        action: 'social_share',
        resource_type: 'share',
        metadata: { platform, content, creditsAwarded: creditsToAward }
      }]);

    if (activityError) {
      console.error('Failed to log social share activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      creditsAwarded: creditsToAward,
      platform,
      message: `Social share bonus! Earned ${creditsToAward} credits.`
    });

  } catch (error) {
    console.error('Social share error:', error);
    return NextResponse.json(
      { error: `Social share failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
