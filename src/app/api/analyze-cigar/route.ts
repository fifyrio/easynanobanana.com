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

const SYSTEM_PROMPT = `You are a master cigar sommelier and tobacconist with decades of experience identifying premium cigars.

You will be given one or two photos of a single cigar (for example a full-body shot and a close-up of the band/label) plus optional notes from the user. Identify the cigar as precisely as the images allow.

Return ONLY a JSON object with these exact fields:
- brand: the manufacturer / brand name (string, "Unknown" if not identifiable)
- line: the specific line or vitola name (string, "Unknown" if unclear)
- origin: country of origin (string)
- wrapper: wrapper leaf type / shade, e.g. "Connecticut Shade", "Maduro", "Habano" (string)
- size: vitola and approximate ring gauge x length, e.g. "Robusto (50 x 5\\")" (string)
- strength: one of "Mild", "Mild-Medium", "Medium", "Medium-Full", "Full" (string)
- tastingNotes: array of 3-6 short flavor descriptors (array of strings)
- estimatedPrice: approximate single-stick retail price range in USD, e.g. "$8 - $12" (string)
- confidence: your identification confidence as one of "Low", "Medium", "High" (string)
- summary: 2-3 sentence expert summary covering the cigar's character, construction, and who would enjoy it (string)

Be honest about uncertainty. If the images are not cigars or are unreadable, set brand to "Unknown" and explain in summary. Never invent a specific brand you cannot see evidence for — use "Unknown" and describe the visible characteristics instead.`;

interface CigarAnalysis {
  brand: string;
  line: string;
  origin: string;
  wrapper: string;
  size: string;
  strength: string;
  tastingNotes: string[];
  estimatedPrice: string;
  confidence: string;
  summary: string;
}

const fileToDataUrl = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  return `data:${file.type};base64,${base64}`;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const primaryImage = formData.get('image') as File | null;
    const secondaryImage = formData.get('image2') as File | null;
    const notes = (formData.get('notes') as string | null)?.trim() || '';

    if (!primaryImage) {
      return NextResponse.json({ error: 'At least one cigar image is required' }, { status: 400 });
    }

    // Auth
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = await createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    const serviceSupabase = createServiceClient();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const creditsRequired = config.credits.imageGeneration;

    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please complete your profile setup first.' },
        { status: 404 }
      );
    }

    if (profile.credits < creditsRequired) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditsRequired, available: profile.credits },
        { status: 402 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Build multimodal message content
    const imageContent: Array<{ type: 'image_url'; image_url: { url: string } }> = [
      { type: 'image_url', image_url: { url: await fileToDataUrl(primaryImage) } },
    ];
    if (secondaryImage && secondaryImage.size > 0) {
      imageContent.push({ type: 'image_url', image_url: { url: await fileToDataUrl(secondaryImage) } });
    }

    const userText = `Identify this cigar from the provided ${imageContent.length > 1 ? 'photos' : 'photo'}.${
      notes ? `\n\nUser notes: ${notes}` : ''
    }\n\nReturn the JSON object exactly as specified.`;

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [{ type: 'text', text: userText }, ...imageContent],
        },
      ],
      temperature: 0.4,
      max_tokens: 700,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI model');
    }

    let result: CigarAnalysis;
    try {
      result = JSON.parse(responseContent);
    } catch {
      const jsonMatch = responseContent.match(/```(?:json)?\s*\n(.*?)\n```/s);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        const braceMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!braceMatch) {
          throw new Error('Could not parse analysis result');
        }
        result = JSON.parse(braceMatch[0]);
      }
    }

    // Deduct credits
    const { error: transactionError } = await serviceSupabase
      .from('credit_transactions')
      .insert([{
        user_id: user.id,
        amount: -creditsRequired,
        transaction_type: 'usage',
        description: 'AI cigar scanner analysis',
      }]);

    if (transactionError) {
      console.error('Failed to create credit transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to process credit deduction' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      creditsUsed: creditsRequired,
      creditsRemaining: profile.credits - creditsRequired,
    });
  } catch (error) {
    console.error('Cigar analysis error:', error);
    return NextResponse.json(
      { error: `Cigar analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
