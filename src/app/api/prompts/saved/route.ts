import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateUser, handleError, createError } from '@/lib/prompts/api-helpers';
import { CachePresets, buildCacheHeader } from '@/lib/cache-headers';

/**
 * GET /api/prompts/saved
 * Get saved prompts for authenticated user
 *
 * Query params:
 * - folder_id: string (optional) - Filter by folder
 * - search: string (optional) - Search query
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const { searchParams } = new URL(request.url);

    const folderId = searchParams.get('folder_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createServiceClient();

    // If search query provided, use search function
    if (search && search.trim()) {
      const { data: prompts, error } = await supabase
        .rpc('search_prompts_lite', {
          user_uuid: user.id,
          search_query: search.trim()
        });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        prompts: prompts || []
      }, {
        headers: {
          'Cache-Control': buildCacheHeader(CachePresets.SHORT_PRIVATE),
        },
      });
    }

    // Otherwise, get prompts with optional folder filter
    // First, get total count
    let countQuery = supabase
      .from('saved_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (folderId) {
      countQuery = countQuery.eq('folder_id', folderId);
    }

    const { count: total } = await countQuery;

    // Then get paginated data
    const offset = (page - 1) * limit;
    let query = supabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', user.id);

    // Filter by folder if specified
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data: prompts, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      prompts: prompts || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit)
      }
    }, {
      headers: {
        'Cache-Control': buildCacheHeader(CachePresets.SHORT_PRIVATE),
      },
    });

  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/prompts/saved
 * Create a new saved prompt
 *
 * Request body:
 * - title: string (required)
 * - prompt_text: string (required)
 * - folder_id: string (optional)
 * - tags: string[] (optional)
 * - thumbnail_url: string (optional)
 * - last_image_id: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const body = await request.json();

    const {
      title,
      prompt_text,
      folder_id,
      tags,
      thumbnail_url,
      last_image_id
    } = body;

    // Validation
    if (!title || !title.trim()) {
      throw createError('Title is required', 400);
    }

    if (!prompt_text || !prompt_text.trim()) {
      throw createError('Prompt text is required', 400);
    }

    const supabase = createServiceClient();

    // If folder_id provided, verify it belongs to user
    if (folder_id) {
      const { data: folder } = await supabase
        .from('prompt_folders')
        .select('id')
        .eq('id', folder_id)
        .eq('user_id', user.id)
        .single();

      if (!folder) {
        throw createError('Invalid folder_id', 400);
      }
    }

    const { data: prompt, error } = await supabase
      .from('saved_prompts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        prompt_text: prompt_text.trim(),
        folder_id: folder_id || null,
        tags: tags || [],
        thumbnail_url,
        last_image_id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      prompt
    });

  } catch (error) {
    return handleError(error);
  }
}
