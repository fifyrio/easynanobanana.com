import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';
import type { AssetItem, AssetView } from '@/types/assets';

const DEFAULT_LIMIT = 24;

type ImageRow = {
  id: string;
  title: string | null;
  prompt: string | null;
  processed_image_url: string;
  thumbnail_url: string | null;
  created_at: string;
  image_type: string;
  is_favorite: boolean | null;
};

type VideoRow = {
  id: string;
  title: string | null;
  prompt: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  effect_type: string;
  is_favorite: boolean | null;
};

function imageToAsset(row: ImageRow): AssetItem {
  return {
    id: row.id,
    title: row.title || (row.prompt ? row.prompt.substring(0, 50) : 'Untitled'),
    prompt: row.prompt,
    media_url: row.processed_image_url,
    thumbnail_url: row.thumbnail_url || row.processed_image_url,
    created_at: row.created_at,
    subtype: row.image_type,
    kind: 'image',
    is_favorite: row.is_favorite ?? false,
  };
}

function videoToAsset(row: VideoRow): AssetItem {
  return {
    id: row.id,
    title: row.title || (row.prompt ? row.prompt.substring(0, 50) : 'Untitled'),
    prompt: row.prompt,
    media_url: row.video_url || '',
    thumbnail_url: row.thumbnail_url,
    created_at: row.created_at,
    subtype: row.effect_type,
    kind: 'video',
    is_favorite: row.is_favorite ?? false,
  };
}

/**
 * GET /api/assets
 * List the authenticated user's generated assets (images + videos).
 *
 * Query params:
 * - view: 'all' | 'favorites' | 'image' | 'video' | 'audio' (default: 'all')
 * - search: string (optional) - matches title or prompt
 * - page: number (default: 1)
 * - limit: number (default: 24)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const view = (searchParams.get('view') || 'all') as AssetView;
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))));

    const supabase = createServiceClient();

    // ---- Sidebar counts (independent of view/pagination) ----
    const imageCountBase = () =>
      supabase.from('images').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('status', 'completed');
    const videoCountBase = () =>
      supabase.from('videos').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('status', 'completed');

    const [imgCount, vidCount, imgFavCount, vidFavCount] = await Promise.all([
      imageCountBase(),
      videoCountBase(),
      imageCountBase().eq('is_favorite', true),
      videoCountBase().eq('is_favorite', true),
    ]);

    const imageTotal = imgCount.count || 0;
    const videoTotal = vidCount.count || 0;
    const favoriteTotal = (imgFavCount.count || 0) + (vidFavCount.count || 0);

    const counts = {
      all: imageTotal + videoTotal,
      favorites: favoriteTotal,
      image: imageTotal,
      video: videoTotal,
      audio: 0,
    };

    // Audio has no backing table yet.
    if (view === 'audio') {
      return NextResponse.json({
        success: true,
        assets: [],
        counts,
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const wantImages = view === 'all' || view === 'favorites' || view === 'image';
    const wantVideos = view === 'all' || view === 'favorites' || view === 'video';

    // Fetch enough rows from each source to cover the requested page after merge.
    const fetchCount = page * limit;

    const buildImageQuery = () => {
      let q = supabase
        .from('images')
        .select('id, title, prompt, processed_image_url, thumbnail_url, created_at, image_type, is_favorite')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      if (view === 'favorites') q = q.eq('is_favorite', true);
      if (search) q = q.or(`title.ilike.%${search}%,prompt.ilike.%${search}%`);
      return q.order('created_at', { ascending: false }).limit(fetchCount);
    };

    const buildVideoQuery = () => {
      let q = supabase
        .from('videos')
        .select('id, title, prompt, video_url, thumbnail_url, created_at, effect_type, is_favorite')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      if (view === 'favorites') q = q.eq('is_favorite', true);
      if (search) q = q.or(`title.ilike.%${search}%,prompt.ilike.%${search}%`);
      return q.order('created_at', { ascending: false }).limit(fetchCount);
    };

    const [imgRes, vidRes] = await Promise.all([
      wantImages ? buildImageQuery() : Promise.resolve({ data: [], error: null }),
      wantVideos ? buildVideoQuery() : Promise.resolve({ data: [], error: null }),
    ]);

    if (imgRes.error || vidRes.error) {
      console.error('Error fetching assets:', imgRes.error || vidRes.error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    const merged: AssetItem[] = [
      ...((imgRes.data as ImageRow[]) || []).map(imageToAsset),
      ...((vidRes.data as VideoRow[]) || []).map(videoToAsset),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Compute the real total for this view from the counts we already have.
    let total = counts.all;
    if (view === 'favorites') total = counts.favorites;
    else if (view === 'image') total = counts.image;
    else if (view === 'video') total = counts.video;

    const offset = (page - 1) * limit;
    const assets = merged.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      assets,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in assets API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
