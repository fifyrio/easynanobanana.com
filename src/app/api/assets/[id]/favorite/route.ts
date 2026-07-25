import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * PATCH /api/assets/:id/favorite
 * Toggle (or set) the favorite flag on one of the user's assets.
 *
 * Body: { is_favorite: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const isFavorite = Boolean(body?.is_favorite);
    // Assets live in two tables; `kind` selects which one to update.
    const table = body?.kind === 'video' ? 'videos' : 'images';

    const supabase = createServiceClient();

    // Update scoped to the owner so a user cannot flip someone else's asset.
    const { data, error } = await supabase
      .from(table)
      .update({ is_favorite: isFavorite })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id, is_favorite')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: data.id, is_favorite: data.is_favorite });
  } catch (error) {
    console.error('Error toggling asset favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
