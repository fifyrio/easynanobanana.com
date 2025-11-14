-- =====================================================
-- Prompt History Lite - Database Migration
-- Version: 1.0
-- Created: 2025-11-14
-- =====================================================

-- =====================================================
-- 1. PROMPT FOLDERS TABLE
-- =====================================================
CREATE TABLE public.prompt_folders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text DEFAULT '📁',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT prompt_folders_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_folders_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Prevent duplicate folder names per user
  CONSTRAINT prompt_folders_user_name_unique UNIQUE (user_id, name)
);

-- Index for faster queries
CREATE INDEX idx_prompt_folders_user_id ON public.prompt_folders(user_id, sort_order);

-- Row Level Security
ALTER TABLE public.prompt_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders" ON public.prompt_folders
  FOR ALL USING (auth.uid() = user_id);


-- =====================================================
-- 2. SAVED PROMPTS TABLE
-- =====================================================
CREATE TABLE public.saved_prompts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  folder_id uuid,  -- NULL = unfiled

  -- Core content
  title text NOT NULL,
  prompt_text text NOT NULL,
  tags text[] DEFAULT '{}',

  -- Associated image (single latest)
  thumbnail_url text,
  last_image_id uuid,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT saved_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_prompts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT saved_prompts_folder_id_fkey FOREIGN KEY (folder_id)
    REFERENCES public.prompt_folders(id) ON DELETE SET NULL,
  CONSTRAINT saved_prompts_last_image_id_fkey FOREIGN KEY (last_image_id)
    REFERENCES public.images(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_saved_prompts_user_id ON public.saved_prompts(user_id, created_at DESC);
CREATE INDEX idx_saved_prompts_folder_id ON public.saved_prompts(folder_id);
CREATE INDEX idx_saved_prompts_tags ON public.saved_prompts USING gin(tags);

-- Row Level Security
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prompts" ON public.saved_prompts
  FOR ALL USING (auth.uid() = user_id);


-- =====================================================
-- 3. SEARCH FUNCTION (Simple ILIKE-based)
-- =====================================================
CREATE OR REPLACE FUNCTION search_prompts_lite(
  user_uuid uuid,
  search_query text
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  folder_id uuid,
  title text,
  prompt_text text,
  tags text[],
  thumbnail_url text,
  last_image_id uuid,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    sp.folder_id,
    sp.title,
    sp.prompt_text,
    sp.tags,
    sp.thumbnail_url,
    sp.last_image_id,
    sp.created_at
  FROM public.saved_prompts sp
  WHERE
    sp.user_id = user_uuid
    AND (
      sp.title ILIKE '%' || search_query || '%'
      OR sp.prompt_text ILIKE '%' || search_query || '%'
      OR search_query = ANY(sp.tags)
    )
  ORDER BY sp.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 4. HELPER FUNCTION - Get prompts with folder info
-- =====================================================
CREATE OR REPLACE FUNCTION get_prompts_with_folder(
  user_uuid uuid,
  folder_uuid uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  prompt_text text,
  tags text[],
  thumbnail_url text,
  folder_id uuid,
  folder_name text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.title,
    sp.prompt_text,
    sp.tags,
    sp.thumbnail_url,
    sp.folder_id,
    pf.name as folder_name,
    sp.created_at
  FROM public.saved_prompts sp
  LEFT JOIN public.prompt_folders pf ON sp.folder_id = pf.id
  WHERE
    sp.user_id = user_uuid
    AND (folder_uuid IS NULL OR sp.folder_id = folder_uuid)
  ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify:

-- Check tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'prompt%';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'prompt%';

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'prompt%';


-- =====================================================
-- 6. ROLLBACK SCRIPT (if needed)
-- =====================================================
-- To rollback this migration, run:
--
-- DROP FUNCTION IF EXISTS search_prompts_lite(uuid, text);
-- DROP FUNCTION IF EXISTS get_prompts_with_folder(uuid, uuid);
-- DROP TABLE IF EXISTS public.saved_prompts CASCADE;
-- DROP TABLE IF EXISTS public.prompt_folders CASCADE;
