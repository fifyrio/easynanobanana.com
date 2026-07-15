-- Add favorite flag to images so the Assets page can filter Favorites.
ALTER TABLE public.images
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Speed up the Assets listing query (per-user, newest first).
CREATE INDEX IF NOT EXISTS idx_images_user_created_completed
  ON public.images (user_id, created_at DESC)
  WHERE status = 'completed';

-- Speed up the Favorites filter.
CREATE INDEX IF NOT EXISTS idx_images_user_favorite
  ON public.images (user_id, created_at DESC)
  WHERE is_favorite = true AND status = 'completed';

-- Videos are surfaced in the same Assets library, so mirror the favorite flag.
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_videos_user_created_completed
  ON public.videos (user_id, created_at DESC)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_videos_user_favorite
  ON public.videos (user_id, created_at DESC)
  WHERE is_favorite = true AND status = 'completed';
