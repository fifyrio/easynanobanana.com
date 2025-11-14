import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateUser, handleError, createError } from '@/lib/prompts/api-helpers';

/**
 * GET /api/prompts/saved/[id]
 * Get a single saved prompt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    const { data: prompt, error } = await supabase
      .from('saved_prompts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Prompt not found', 404);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      prompt
    });

  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/prompts/saved/[id]
 * Update a saved prompt
 *
 * Request body (all optional):
 * - title: string
 * - prompt_text: string
 * - folder_id: string | null
 * - tags: string[]
 * - thumbnail_url: string
 * - last_image_id: string
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const supabase = createServiceClient();

    // Build update object
    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (prompt_text !== undefined) updates.prompt_text = prompt_text.trim();
    if (folder_id !== undefined) updates.folder_id = folder_id;
    if (tags !== undefined) updates.tags = tags;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (last_image_id !== undefined) updates.last_image_id = last_image_id;

    if (Object.keys(updates).length === 0) {
      throw createError('No fields to update', 400);
    }

    // If folder_id is being updated and not null, verify it belongs to user
    if (folder_id && folder_id !== null) {
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
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Prompt not found', 404);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      prompt
    });

  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/prompts/saved/[id]
 * Delete a saved prompt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('saved_prompts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Prompt not found', 404);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    });

  } catch (error) {
    return handleError(error);
  }
}
