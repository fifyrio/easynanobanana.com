import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToR2 } from '@/lib/r2';

/**
 * Image Upload API Endpoint
 *
 * Uploads user images to R2 storage and returns a public URL.
 * Accepts files via FormData (more efficient than base64).
 *
 * Request Body (FormData):
 *   - file: File object from input[type="file"]
 *
 * Response:
 *   - success: boolean
 *   - imageUrl: public R2 URL of uploaded image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename
    const ext = file.type.split('/')[1] || 'png';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const finalFilename = `upload-${timestamp}-${random}.${ext}`;

    // Upload to R2
    const imageUrl = await uploadImageToR2(buffer, finalFilename, file.type);

    console.log(`✅ Image uploaded to R2: ${finalFilename} (${buffer.length} bytes)`);

    return NextResponse.json({
      success: true,
      imageUrl,
      filename: finalFilename,
      size: buffer.length
    });

  } catch (error: any) {
    console.error('❌ Image upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
