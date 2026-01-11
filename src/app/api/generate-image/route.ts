import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { uploadImageToR2 } from '@/lib/r2';
import { imageLimiter } from '@/lib/rate-limiter';
import { withRetry, RetryableError } from '@/lib/retry-utils';

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

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('Generating image with prompt:', prompt);

    let response;
    try {
      response = await withRetry(
        async () => {
          try {
            console.log('Calling OpenRouter API...');
            const result = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "EasyNanoBanana AI Image Generator",
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                "model": "google/gemini-2.5-flash-image-preview",
                "messages": [
                  {
                    "role": "user",
                    "content": imageUrls && imageUrls.length > 0 ? [
                      {
                        "type": "text",
                        "text": prompt
                      },
                      ...imageUrls.map((url: string) => ({
                        "type": "image_url",
                        "image_url": {
                          "url": url
                        }
                      }))
                    ] : `Generate an image: ${prompt}`
                  }
                ],
                "modalities": ["image", "text"]
              })
            });

            console.log('OpenRouter API response status:', result.status);

            if (!result.ok) {
              const errorText = await result.text();
              console.error('OpenRouter API error:', errorText);
              if (result.status === 429) {
                throw new RetryableError(`Rate limit exceeded: ${errorText}`, true);
              }
              if (result.status >= 500) {
                throw new RetryableError(`Server error: ${errorText}`, true);
              }
              throw new RetryableError(`API error: ${errorText}`, false);
            }

            const jsonResponse = await result.json();
            console.log('OpenRouter API call successful');
            return jsonResponse;
          } catch (error: any) {
            console.error('OpenRouter API call failed:', error);
            // Handle fetch errors
            if (error instanceof RetryableError) {
              throw error;
            }

            // Handle network errors (including ECONNRESET)
            if (error?.code === 'ECONNREFUSED' ||
                error?.code === 'ENOTFOUND' ||
                error?.code === 'ECONNRESET' ||
                error?.cause?.code === 'ECONNRESET' ||
                error?.message?.includes('fetch') ||
                error?.message?.includes('ECONNRESET')) {
              console.log('Network error detected, will retry...');
              throw new RetryableError(`Network error: ${error.message}`, true);
            }

            // Non-retryable errors
            throw new RetryableError(error.message || 'Unknown error', false);
          }
        },
        {
          maxAttempts: 3,
          initialDelayMs: 2000,
          maxDelayMs: 60000,
          backoffFactor: 2
        }
      );
    } catch (error: any) {
      console.error('Failed to generate image after retries:', error);
      throw new Error(`Failed to generate image: ${error.message || 'Network error occurred'}`);
    }

    if (!response.choices || response.choices.length === 0) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      );
    }

    const choice = response.choices[0];
    let description = '';
    let imageBase64 = '';

    // Get description from content if available
    if (choice.message?.content && typeof choice.message.content === 'string') {
      description = choice.message.content;
      console.log('Generated description:', description);
    }

    // Get image from images field (OpenRouter format)
    if (choice.message?.images && Array.isArray(choice.message.images) && choice.message.images.length > 0) {
      const imageData = choice.message.images[0];
      console.log('Raw image data type:', typeof imageData);
      console.log('Raw image data:', imageData);
      
      if (typeof imageData === 'string') {
        imageBase64 = imageData;
        console.log('Generated image data received, size:', imageBase64.length);
      } else if (imageData && typeof imageData === 'object') {
        // Handle object format - might have url, data, base64, or image_url field
        if (imageData.data) {
          imageBase64 = imageData.data;
        } else if (imageData.base64) {
          imageBase64 = imageData.base64;
        } else if (imageData.image_url?.url) {
          // Handle OpenRouter's image_url object format
          const extractImageUrl = imageData.image_url.url;
          if (extractImageUrl.startsWith('data:image/')) {
            // Extract base64 from data URL
            const matches = extractImageUrl.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
            if (matches && matches[1]) {
              imageBase64 = matches[1];
            }
          }
        } else if (imageData.url && imageData.url.startsWith('data:image/')) {
          // Extract base64 from data URL
          const matches = imageData.url.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
          if (matches && matches[1]) {
            imageBase64 = matches[1];
          }
        }
        console.log('Extracted image data size:', imageBase64?.length || 'none');
      }
    }
    // Fallback: Check for base64 data in content
    else if (choice.message?.content && typeof choice.message.content === 'string') {
      const content = choice.message.content;
      if (content.includes('data:image/')) {
        const matches = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (matches && matches[1]) {
          imageBase64 = matches[1];
          console.log('Generated image data found in content, size:', imageBase64.length);
        }
      }
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'No image generated. The model may have returned text only.' },
        { status: 500 }
      );
    }

    // Validate base64 string format
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      console.error('Invalid base64 format:', imageBase64.substring(0, 100));
      return NextResponse.json(
        { error: 'Invalid image data format received from API.' },
        { status: 500 }
      );
    }

    // Create unique filename and upload to R2
    const filename = `generated-image-${Date.now()}.png`;
    const buffer = Buffer.from(imageBase64, 'base64');
    
    const uploadedImageUrl = await uploadImageToR2(buffer, filename, 'image/png');
    console.log('Image uploaded to R2:', filename);

    // Create image record in database and deduct credits
    const { data: imageRecord, error: imageError } = await serviceSupabase
      .from('images')
      .insert([{
        user_id: user.id,
        title: `Generated: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
        prompt: prompt,
        processed_image_url: uploadedImageUrl,
        status: 'completed',
        image_type: 'generation',
        style: 'realistic',
        dimensions: '512x512',
        cost: creditsRequired,
        metadata: {
          ...metadata, // Include metadata from request (e.g. { type: 'infographic' })
          original_filename: filename,
          model: 'google/gemini-2.5-flash-image-preview',
          provider: 'openrouter',
          input_images_count: imageUrls ? imageUrls.length : 0
        }
      }])
      .select()
      .single();

    if (imageError) {
      console.error('Failed to create image record:', imageError);
      // Don't fail the request, but log the error
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
          image_id: imageRecord?.id || null
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

    return NextResponse.json({
      success: true,
      description: description || 'AI generated image',
      imageUrl: uploadedImageUrl,
      originalPrompt: prompt,
      filename: filename,
      creditsUsed: creditsRequired,
      creditsRemaining: profile.credits - creditsRequired
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    // Handle specific error types with appropriate status codes
    if (error instanceof RetryableError || 
        error?.status === 429 || 
        error?.message?.includes('429') ||
        error?.message?.includes('Too Many Requests') ||
        error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable due to high demand',
          message: 'The image generation service is currently experiencing high demand. Please try again in a few minutes.',
          retryAfterSeconds: 60
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
