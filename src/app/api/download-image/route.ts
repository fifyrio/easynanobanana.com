import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, type, filename } = await request.json();
    
    if (!imageUrl || !type || !filename) {
      return NextResponse.json(
        { error: 'Image URL, type, and filename are required' },
        { status: 400 }
      );
    }

    // For original quality, check authentication and credits
    if (type === 'original') {
      // Get authorization token from header
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required for original quality' },
          { status: 401 }
        );
      }

      // Initialize Supabase client and set auth
      const supabase = await createAuthenticatedClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Use service client for database operations to bypass RLS
      const serviceSupabase = createServiceClient();
      
      // Get user profile and check credits
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

      if (profile.credits < 1) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits', 
            required: 1, 
            available: profile.credits 
          },
          { status: 402 }
        );
      }

      // Deduct credit via transaction
      const { error: transactionError } = await serviceSupabase
        .from('credit_transactions')
        .insert([{
          user_id: user.id,
          amount: -1,
          transaction_type: 'usage',
          description: 'Background removal - original quality download'
        }]);

      if (transactionError) {
        console.error('Failed to create credit transaction:', transactionError);
        return NextResponse.json(
          { error: 'Failed to process credit deduction' },
          { status: 500 }
        );
      }
    }

    // Validate and normalize the image URL
    console.log('Attempting to download image from:', imageUrl);

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    // Fetch the image from R2 with timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let imageResponse;
    try {
      imageResponse = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EasyNanoBanana/1.0'
        }
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);

      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Download timeout - image may be too large or server is slow' },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: `Failed to fetch image: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!imageResponse.ok) {
      console.error('Image fetch failed with status:', imageResponse.status);
      return NextResponse.json(
        { error: `Failed to fetch image from storage (${imageResponse.status})` },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    console.log(`Successfully downloaded image: ${imageBuffer.byteLength} bytes, type: ${contentType}`);

    // Return the image with proper download headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
