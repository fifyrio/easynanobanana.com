import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateUser, handleError, createError } from '@/lib/prompts/api-helpers';

/**
 * PUT /api/prompts/folders/[id]
 * Update a folder
 *
 * Request body:
 * - name: string (optional)
 * - icon: string (optional)
 * - sort_order: number (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const body = await request.json();
    const { name, icon, sort_order } = body;

    const supabase = createServiceClient();

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (icon !== undefined) updates.icon = icon;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    if (Object.keys(updates).length === 0) {
      throw createError('No fields to update', 400);
    }

    const { data: folder, error } = await supabase
      .from('prompt_folders')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Folder not found', 404);
      }
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

/**
 * DELETE /api/prompts/folders/[id]
 * Delete a folder
 * Note: Prompts in this folder will have folder_id set to NULL
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('prompt_folders')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Folder not found', 404);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully'
    });

  } catch (error) {
    return handleError(error);
  }
}
