import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://easynanobanana.com',
    'X-Title': 'EasyNanoBanana - AI Tools Platform',
  },
});

const SYSTEM_PROMPT = `You are a top-tier prompt engineering expert and architect. Your role is to take user descriptions and transform them into highly optimized, detailed prompts for AI image generation.

Key responsibilities:
1. Enhance clarity and specificity
2. Add appropriate technical details (camera settings, lighting, style)
3. Structure prompts for maximum AI understanding
4. Include relevant negative prompts when beneficial
5. Maintain the user's creative intent while improving execution

Guidelines:
- Always start with the main subject and action
- Add specific visual details (colors, textures, materials)
- Include lighting and composition details
- Specify style when appropriate (photorealistic, artistic, etc.)
- Keep prompts concise but comprehensive
- Avoid unnecessary words that don't improve the output

Return your response as a JSON object with these fields:
- optimizedPrompt: The enhanced main prompt
- negativePrompt: Suggested negative prompt (can be empty)
- explanation: Brief explanation of the enhancements made`;

export async function POST(request: NextRequest) {
  try {
    const { description, tone, detailLevel, currentNegativePrompt } = await request.json();
    
    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const userPrompt = `Please optimize this image generation prompt:

Original description: "${description}"
Desired tone: ${tone}
Detail level: ${detailLevel}
Current negative prompt: "${currentNegativePrompt || 'none'}"

Transform this into a professional, optimized prompt that will generate high-quality results.`;

    console.log('Enhancing prompt with OpenRouter...');

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response from AI model');
    }

    // Try to parse as JSON, fallback to plain text
    let result;
    try {
      result = JSON.parse(responseContent);
    } catch {
      // If not JSON, create structured response from plain text
      result = {
        optimizedPrompt: responseContent,
        negativePrompt: '',
        explanation: 'Prompt enhanced by AI'
      };
    }

    console.log('Prompt enhancement completed');

    return NextResponse.json({
      success: true,
      ...result,
      originalDescription: description,
    });

  } catch (error) {
    console.error('Prompt enhancement error:', error);
    return NextResponse.json(
      { 
        error: `Prompt enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}