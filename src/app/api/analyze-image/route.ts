import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';
import { config } from '@/lib/config';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://easynanobanana.com',
    'X-Title': 'EasyNanoBanana - AI Tools Platform',
  },
});

const SYSTEM_PROMPT = `You are a professional prompt engineer and image analysis expert. Your task is to reverse engineer images and create detailed prompts that could recreate them.

Analyze the provided image and create a comprehensive prompt that captures:
1. Main subject and composition
2. Visual style and aesthetic
3. Lighting and atmosphere  
4. Colors and textures
5. Technical details (camera angle, depth of field, etc.)
6. Artistic style if applicable

Return your response as a JSON object with these fields:
- optimizedPrompt: A detailed prompt that could recreate this image
- negativePrompt: Suggested negative prompt to avoid unwanted elements
- explanation: Brief explanation of the key visual elements identified

Be specific and detailed to ensure the generated prompt would create a similar image.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const tone = formData.get('tone') as string || 'Photoreal';
    const detailLevel = formData.get('detailLevel') as string || 'Basic';
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
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
    const serviceSupabase = createServiceClient();
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user credits and deduct for image analysis
    const creditsRequired = config.credits.promptEnhancement; // Same cost as text prompt enhancement
    
    // Get user profile using service client to bypass RLS
    let { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
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
        { status: 402 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${base64}`;

    const userPrompt = `Reverse engineer this image. I want you to write a prompt that will recreate this as a new image.

Additional context:
- Desired tone: ${tone}
- Detail level: ${detailLevel}

Analyze the image thoroughly and create a comprehensive prompt that captures all the key visual elements, style, composition, and technical aspects needed to recreate this image.`;

    console.log('Analyzing image with OpenRouter...');

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response from AI model');
    }

    // Try to parse as JSON, handle markdown code blocks
    let result;
    try {
      // First try direct JSON parsing
      result = JSON.parse(responseContent);
    } catch {
      // Check if content is wrapped in markdown code blocks
      const jsonMatch = responseContent.match(/```(?:json)?\s*\n(.*?)\n```/s);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[1].trim());
        } catch {
          // If JSON in code block is malformed, fall back to plain text
          result = {
            optimizedPrompt: responseContent,
            negativePrompt: '',
            explanation: 'Image analyzed by AI'
          };
        }
      } else {
        // If not JSON or code block, create structured response from plain text
        result = {
          optimizedPrompt: responseContent,
          negativePrompt: '',
          explanation: 'Image analyzed by AI'
        };
      }
    }

    console.log('Image analysis completed');

    // Deduct credits via credit transaction
    const { error: transactionError } = await serviceSupabase
      .from('credit_transactions')
      .insert([{
        user_id: user.id,
        amount: -creditsRequired,
        transaction_type: 'usage',
        description: 'AI image analysis and prompt generation'
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
      ...result,
      originalFilename: imageFile.name,
      creditsUsed: creditsRequired,
      creditsRemaining: profile.credits - creditsRequired
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { 
        error: `Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
