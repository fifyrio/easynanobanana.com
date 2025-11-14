import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateUser, handleError, createError } from '@/lib/prompts/api-helpers';

/**
 * GET /api/prompts/folders
 * Get all folders for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    const { data: folders, error } = await supabase
      .from('prompt_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      folders: folders || []
    });

  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/prompts/folders
 * Create a new folder
 *
 * Request body:
 * - name: string (required)
 * - icon: string (optional, default: '📁')
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const body = await request.json();

    const { name, icon } = body;

    if (!name || !name.trim()) {
      throw createError('Folder name is required', 400);
    }

    const supabase = createServiceClient();

    // Get current max sort_order for this user
    const { data: folders } = await supabase
      .from('prompt_folders')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = folders && folders.length > 0
      ? (folders[0].sort_order || 0) + 1
      : 0;

    const { data: folder, error } = await supabase
      .from('prompt_folders')
      .insert({
        user_id: user.id,
        name: name.trim(),
        icon: icon || '📁',
        sort_order: nextSortOrder
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw createError('A folder with this name already exists', 409);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      folder
    });

  } catch (error) {
    return handleError(error);
  }
}
