import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Initialize Supabase client and verify auth
    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const imageType = searchParams.get('type'); // generation, background_removal, edit, template
    const offset = (page - 1) * limit;

    // Use service client to bypass RLS
    const serviceSupabase = createServiceClient();

    // Build query
    let query = serviceSupabase
      .from('images')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add type filter if provided
    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    const { data: images, error: imagesError, count } = await query;

    if (imagesError) {
      console.error('Failed to fetch images:', imagesError);
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    // Get total credits used
    const { data: stats } = await serviceSupabase
      .from('images')
      .select('cost')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const totalCreditsUsed = stats?.reduce((sum, img) => sum + (img.cost || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      images: images || [],
      pagination: {
        total: count || 0,
        page,
        pageSize: limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: {
        totalImages: count || 0,
        totalCreditsUsed
      }
    });

  } catch (error: any) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: `Failed to fetch history: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
