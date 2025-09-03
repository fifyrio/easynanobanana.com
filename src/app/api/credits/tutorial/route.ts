import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { tutorialType } = await request.json();
    
    if (!tutorialType) {
      return NextResponse.json(
        { error: 'Tutorial type is required' },
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
    
    // Get user profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user already completed this tutorial
    const { data: existingCompletion, error: completionCheckError } = await serviceSupabase
      .from('credit_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'bonus')
      .like('description', `%${tutorialType} tutorial%`)
      .limit(1);

    if (completionCheckError) {
      console.error('Failed to check tutorial completion:', completionCheckError);
      return NextResponse.json(
        { error: 'Failed to verify tutorial status' },
        { status: 500 }
      );
    }

    if (existingCompletion && existingCompletion.length > 0) {
      return NextResponse.json(
        { error: 'Tutorial already completed' },
        { status: 409 }
      );
    }

    // Award credits based on tutorial type
    const tutorialRewards: { [key: string]: number } = {
      'intro': 3,
      'advanced': 5,
      'expert': 10
    };

    const creditsToAward = tutorialRewards[tutorialType] || 3;

    // Create credit transaction
    const { error: transactionError } = await serviceSupabase
      .from('credit_transactions')
      .insert([{
        user_id: user.id,
        amount: creditsToAward,
        transaction_type: 'bonus',
        description: `${tutorialType.charAt(0).toUpperCase() + tutorialType.slice(1)} tutorial completion reward`
      }]);

    if (transactionError) {
      console.error('Failed to create credit transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to award tutorial credits' },
        { status: 500 }
      );
    }

    // Log tutorial completion activity
    const { error: activityError } = await serviceSupabase
      .from('user_activity')
      .insert([{
        user_id: user.id,
        action: 'tutorial_completed',
        resource_type: 'tutorial',
        metadata: { tutorialType, creditsAwarded: creditsToAward }
      }]);

    if (activityError) {
      console.error('Failed to log tutorial activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({
      success: true,
      creditsAwarded: creditsToAward,
      tutorialType,
      newBalance: profile.credits + creditsToAward,
      message: `Tutorial completed! Earned ${creditsToAward} credits.`
    });

  } catch (error) {
    console.error('Tutorial completion error:', error);
    return NextResponse.json(
      { error: `Tutorial completion failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}