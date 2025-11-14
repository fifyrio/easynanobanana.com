import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/prompt-history
 * Get user's prompt history from images table
 *
 * Query params:
 * - search: string (optional) - Search query for prompts
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use service client for database queries
    const supabase = createServiceClient();

    // First get total count of unique prompts
    let countQuery = supabase
      .from('images')
      .select('prompt', { count: 'exact' })
      .eq('user_id', user.id)
      .not('prompt', 'is', null)
      .eq('status', 'completed');

    if (search && search.trim()) {
      countQuery = countQuery.ilike('prompt', `%${search.trim()}%`);
    }

    const { count: totalCount } = await countQuery;

    // Build query for images (fetch more to account for duplicates)
    const fetchLimit = limit * 3; // Fetch 3x to handle deduplication
    let query = supabase
      .from('images')
      .select('id, title, prompt, processed_image_url, thumbnail_url, created_at, style, image_type')
      .eq('user_id', user.id)
      .not('prompt', 'is', null)  // Only images with prompts
      .eq('status', 'completed');  // Only completed images

    // Apply search filter if provided
    if (search && search.trim()) {
      query = query.ilike('prompt', `%${search.trim()}%`);
    }

    const { data: images, error } = await query
      .order('created_at', { ascending: false })
      .limit(fetchLimit);

    if (error) {
      console.error('Error fetching prompt history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt history' },
        { status: 500 }
      );
    }

    // Group prompts by unique text to avoid duplicates
    const uniquePrompts = new Map();

    images?.forEach(image => {
      if (image.prompt && !uniquePrompts.has(image.prompt)) {
        uniquePrompts.set(image.prompt, {
          id: image.id,
          prompt: image.prompt,
          title: image.title || image.prompt.substring(0, 50) + '...',
          thumbnail_url: image.thumbnail_url || image.processed_image_url,
          image_url: image.processed_image_url,
          created_at: image.created_at,
          style: image.style,
          image_type: image.image_type
        });
      }
    });

    const allPrompts = Array.from(uniquePrompts.values());

    // Apply pagination to unique prompts
    const offset = (page - 1) * limit;
    const prompts = allPrompts.slice(offset, offset + limit);
    const total = allPrompts.length;

    return NextResponse.json({
      success: true,
      prompts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error in prompt history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
