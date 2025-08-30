import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
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
    const publicDir = path.join(process.cwd(), 'public', 'generated');
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, filename);
    const buffer = Buffer.from(imageBase64, 'base64');
    
    fs.writeFileSync(filePath, buffer);
    console.log('Image saved to:', filePath);

    const imageUrl = `/generated/${filename}`;

    return NextResponse.json({
      success: true,
      description: description || 'AI generated image',
      imageUrl: imageUrl,
      originalPrompt: prompt,
      filename: filename
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}