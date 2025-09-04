import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createAuthenticatedClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
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
    const supabase = createAuthenticatedClient();
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


    // Check user credits and deduct for image generation (5 credits)
    const creditsRequired = 5;
    
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

    if (profile.credits < creditsRequired) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits', 
          required: creditsRequired, 
          available: profile.credits 
        },
        { status: 402 } // Payment Required
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });

    console.log('Generating image with prompt:', prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt,
    });

    if (!response.candidates || response.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      );
    }

    const parts = response.candidates[0].content?.parts || [];
    let description = '';
    let imageBase64 = '';

    for (const part of parts) {
      if (part.text) {
        description = part.text;
        console.log('Generated description:', part.text);
      } else if (part.inlineData?.data) {
        imageBase64 = part.inlineData.data;
        console.log('Generated image data received, size:', imageBase64.length);
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `generated-image-${timestamp}.png`;
    const buffer = Buffer.from(imageBase64, 'base64');
    
    // Upload to R2 (Cloudflare R2)
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `generated/${filename}`,
      Body: buffer,
      ContentType: 'image/png',
      ContentDisposition: 'inline',
    });

    await s3Client.send(uploadCommand);
    console.log('Image uploaded to R2:', filename);

    const imageUrl = `${process.env.R2_PUBLIC_URL}/generated/${filename}`;

    // Create image record in database and deduct credits
    const { data: imageRecord, error: imageError } = await serviceSupabase
      .from('images')
      .insert([{
        user_id: user.id,
        title: `Generated: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
        prompt: prompt,
        processed_image_url: imageUrl,
        status: 'completed',
        image_type: 'generation',
        style: 'realistic',
        dimensions: '512x512',
        cost: creditsRequired,
        metadata: {
          original_filename: filename,
          gemini_model: 'gemini-2.5-flash-image-preview'
        }
      }])
      .select()
      .single();

    if (imageError) {
      console.error('Failed to create image record:', imageError);
      // Don't fail the request, but log the error
    }

    // Deduct credits via credit transaction
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
      return NextResponse.json(
        { error: 'Failed to process credit deduction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      description: description || 'AI generated image',
      imageUrl: imageUrl,
      originalPrompt: prompt,
      filename: filename,
      creditsUsed: creditsRequired,
      creditsRemaining: profile.credits - creditsRequired
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}