import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { saveKIETaskMetadata } from '@/lib/r2';
import { imageLimiter } from '@/lib/rate-limiter';
import { KIEImageService } from '@/lib/kie-api/kie-image-service';

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageUrls, metadata } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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
    
    // For database operations, use service client to bypass RLS
    const { createServiceClient } = await import('@/lib/supabase-server');
    const serviceSupabase = createServiceClient();
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!imageLimiter.isAllowed(user.id)) {
      const timeUntilReset = imageLimiter.getTimeUntilReset(user.id);
      const remainingRequests = imageLimiter.getRemainingRequests(user.id);
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          timeUntilResetMs: timeUntilReset,
          remainingRequests: remainingRequests,
          message: `Too many requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`
        },
        { status: 429 }
      );
    }


    // Check user credits and deduct for image generation (5 credits)
    let creditsRequired = 5;
    const isInfographic = metadata?.type === 'infographic';

    // Implement Daily Free Limit for Infographics
    if (isInfographic) {
      try {
        // 1. Calculate the start of the current day (UTC 00:00:00)
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayIsoString = today.toISOString();

        // 2. Count today's generated infographics for this user
        const { count, error: countError } = await serviceSupabase
          .from('images')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayIsoString)
          // We assume infographics are stored as 'generation' type but distinguished by metadata
          // If using 'image_type' column check, use that instead. 
          // Since we rely on metadata for the tag:
          .contains('metadata', { type: 'infographic' });

        if (countError) {
          console.error('Error counting daily infographics:', countError);
          // Fallback to charging credits if counting fails to prevent abuse
        } else if (count !== null) {
          const dailyFreeLimit = 3;
          console.log(`User ${user.id} infographic count today: ${count}`);
          
          if (count < dailyFreeLimit) {
            creditsRequired = 0; // FREE!
            console.log(`User ${user.id} is within free daily limit (${count}/${dailyFreeLimit}). Cost: 0.`);
          } else {
            console.log(`User ${user.id} exceeded free daily limit. Charging ${creditsRequired} credits.`);
          }
        }
      } catch (e) {
        console.error('Error in daily limit logic:', e);
        // Fallback to charging
      }
    }
    
    // Get user profile using service client to bypass RLS
    let { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Profile doesn't exist, return error
      console.log('User profile not found for user:', user.id);
      return NextResponse.json(
        { error: 'User profile not found. Please complete your profile setup first.' },
        { status: 404 }
      );
    }

    if (creditsRequired > 0 && profile.credits < creditsRequired) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits', 
          required: creditsRequired, 
          available: profile.credits 
        },
        { status: 402 } // Payment Required
      );
    }

    // Check KIE API token is configured
    const KIE_API_TOKEN = process.env.KIE_API_TOKEN;
    if (!KIE_API_TOKEN) {
      return NextResponse.json(
        { error: 'KIE_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    console.log('Starting KIE image generation task with prompt:', prompt);

    // Initialize KIE service
    const kieService = new KIEImageService();

    // Create task based on input type
    let taskId: string;
    try {
      if (imageUrls && imageUrls.length > 0) {
        // Image editing mode (with reference images)
        console.log(`Creating KIE task with ${imageUrls.length} image(s)`);
        taskId = await kieService.createTask(
          prompt,
          imageUrls,
          '9:16',
          'google/nano-banana-edit'
        );
      } else {
        // Text-to-image mode (prompt only)
        console.log('Creating KIE prompt-only task');
        taskId = await kieService.createPromptOnlyTask(
          prompt,
          '9:16',
          'google/nano-banana'
        );
      }
      console.log('✅ KIE task created:', taskId);
    } catch (error: any) {
      console.error('❌ Failed to create KIE task:', error);
      return NextResponse.json(
        {
          error: 'Failed to create image generation task',
          message: error.message || 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Save task metadata to R2
    try {
      await saveKIETaskMetadata({
        taskId,
        status: 'pending',
        prompt,
        imageUrl: imageUrls?.[0] || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ Task metadata saved to R2');
    } catch (error) {
      console.error('⚠️  Failed to save task metadata:', error);
      // Continue anyway - callback can still work
    }

    // Deduct credits via credit transaction ONLY if cost > 0
    if (creditsRequired > 0) {
      const { error: transactionError } = await serviceSupabase
        .from('credit_transactions')
        .insert([{
          user_id: user.id,
          amount: -creditsRequired,
          transaction_type: 'usage',
          description: 'AI image generation',
          image_id: null
        }]);

      if (transactionError) {
        console.error('Failed to create credit transaction:', transactionError);
        // Consider whether to return error or just log it since image is already generated
        // return NextResponse.json(
        //   { error: 'Failed to process credit deduction' },
        //   { status: 500 }
        // );
      }
    } else {
      console.log('Free generation - skipping credit deduction.');
    }

    // Return taskId for client-side polling
    return NextResponse.json({
      success: true,
      taskId: taskId,
      status: 'pending',
      message: 'Image generation started. Use the taskId to check status.',
      originalPrompt: prompt,
      creditsUsed: creditsRequired,
      creditsRemaining: profile.credits - creditsRequired
    });

  } catch (error: any) {
    console.error('Image generation error:', error);

    // Handle KIE API errors
    if (error?.message?.includes('KIE API')) {
      return NextResponse.json(
        {
          error: 'Image generation service error',
          message: error.message || 'Failed to communicate with image generation service',
        },
        { status: 503 } // Service Unavailable
      );
    }

    if (error?.status === 400) {
      return NextResponse.json(
        { error: 'Invalid request', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
