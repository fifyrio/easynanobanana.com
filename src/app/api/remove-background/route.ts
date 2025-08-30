import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { uploadImageToR2 } from '@/lib/r2-upload';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Convert file to base64 data URL for Replicate
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('Processing background removal with Replicate...');

    // Run Replicate background removal model
    const output = await replicate.run(
      "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
      {
        input: {
          image: dataUrl
        }
      }
    ) as any;

    // Download the processed image from Replicate
    const imageResponse = await fetch(output);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch processed image: ${imageResponse.statusText}`);
    }

    const processedImageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Upload to R2
    const filename = `bg-removed-${Date.now()}.png`;
    const r2Url = await uploadImageToR2(
      processedImageBuffer,
      filename,
      'image/png'
    );

    console.log('Background removal completed, uploaded to R2:', r2Url);

    return NextResponse.json({
      success: true,
      imageUrl: r2Url,
      originalFilename: file.name,
    });

  } catch (error) {
    console.error('Background removal error:', error);
    return NextResponse.json(
      { 
        error: `Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}