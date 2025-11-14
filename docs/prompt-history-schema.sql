-- Prompt History Feature - Database Schema Extensions

-- =====================================================
-- 1. PROMPT FOLDERS TABLE
-- =====================================================
-- Stores user-created folders for organizing prompts
CREATE TABLE public.prompt_folders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text,  -- emoji or icon identifier
  color text,  -- hex color for folder UI
  sort_order integer DEFAULT 0,
  is_system boolean DEFAULT false,  -- true for "All Prompts" default folder
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT prompt_folders_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_folders_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Prevent duplicate folder names per user
  CONSTRAINT prompt_folders_user_name_unique UNIQUE (user_id, name)
);

-- Index for faster folder queries
CREATE INDEX idx_prompt_folders_user_id ON public.prompt_folders(user_id);
CREATE INDEX idx_prompt_folders_sort_order ON public.prompt_folders(user_id, sort_order);


-- =====================================================
-- 2. SAVED PROMPTS TABLE
-- =====================================================
-- Stores user's saved prompts with full metadata
CREATE TABLE public.saved_prompts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  folder_id uuid,  -- NULL = unfiled/default folder

  -- Prompt content
  title text NOT NULL,  -- User-defined or auto-generated from prompt
  prompt_text text NOT NULL,  -- The actual prompt
  negative_prompt text,  -- Optional negative prompt

  -- Tags and categorization
  tags text[] DEFAULT '{}',  -- Searchable tags

  -- Generation parameters (optional, for regeneration)
  style text,  -- e.g., "realistic", "anime", "oil painting"
  dimensions text DEFAULT '512x512',
  model_name text,  -- AI model used
  seed integer,  -- Random seed for reproducibility
  cfg_scale numeric,  -- Guidance scale
  steps integer,  -- Generation steps

  -- Metadata
  usage_count integer DEFAULT 0,  -- How many times this prompt was used
  last_used_at timestamp with time zone,
  is_favorite boolean DEFAULT false,

  -- Soft delete support
  is_archived boolean DEFAULT false,
  archived_at timestamp with time zone,

  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT saved_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_prompts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT saved_prompts_folder_id_fkey FOREIGN KEY (folder_id)
    REFERENCES public.prompt_folders(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_saved_prompts_user_id ON public.saved_prompts(user_id);
CREATE INDEX idx_saved_prompts_folder_id ON public.saved_prompts(folder_id);
CREATE INDEX idx_saved_prompts_tags ON public.saved_prompts USING gin(tags);
CREATE INDEX idx_saved_prompts_is_favorite ON public.saved_prompts(user_id, is_favorite)
  WHERE is_favorite = true;
CREATE INDEX idx_saved_prompts_created_at ON public.saved_prompts(user_id, created_at DESC);

-- Full-text search index for prompt content
CREATE INDEX idx_saved_prompts_search ON public.saved_prompts
  USING gin(to_tsvector('english', title || ' ' || prompt_text || ' ' || array_to_string(tags, ' ')));


-- =====================================================
-- 3. PROMPT IMAGES JUNCTION TABLE
-- =====================================================
-- Links saved prompts to generated images (many-to-many)
CREATE TABLE public.prompt_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  prompt_id uuid NOT NULL,
  image_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT prompt_images_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_images_prompt_id_fkey FOREIGN KEY (prompt_id)
    REFERENCES public.saved_prompts(id) ON DELETE CASCADE,
  CONSTRAINT prompt_images_image_id_fkey FOREIGN KEY (image_id)
    REFERENCES public.images(id) ON DELETE CASCADE,

  -- Prevent duplicate associations
  CONSTRAINT prompt_images_unique UNIQUE (prompt_id, image_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_prompt_images_prompt_id ON public.prompt_images(prompt_id);
CREATE INDEX idx_prompt_images_image_id ON public.prompt_images(image_id);


-- =====================================================
-- 4. EXTEND EXISTING IMAGES TABLE
-- =====================================================
-- Add optional reference to saved prompt (for quick lookup)
ALTER TABLE public.images
  ADD COLUMN saved_prompt_id uuid REFERENCES public.saved_prompts(id) ON DELETE SET NULL;

CREATE INDEX idx_images_saved_prompt_id ON public.images(saved_prompt_id);


-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.prompt_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_images ENABLE ROW LEVEL SECURITY;

-- Prompt Folders Policies
CREATE POLICY "Users can view their own folders"
  ON public.prompt_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON public.prompt_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.prompt_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.prompt_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Saved Prompts Policies
CREATE POLICY "Users can view their own prompts"
  ON public.saved_prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompts"
  ON public.saved_prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON public.saved_prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON public.saved_prompts FOR DELETE
  USING (auth.uid() = user_id);

-- Prompt Images Policies (access through prompts)
CREATE POLICY "Users can view prompt-image associations for their prompts"
  ON public.prompt_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_prompts
      WHERE id = prompt_images.prompt_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create prompt-image associations for their prompts"
  ON public.prompt_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.saved_prompts
      WHERE id = prompt_images.prompt_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete prompt-image associations for their prompts"
  ON public.prompt_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_prompts
      WHERE id = prompt_images.prompt_id AND user_id = auth.uid()
    )
  );


-- =====================================================
-- 6. UTILITY FUNCTIONS
-- =====================================================

-- Function to auto-increment usage count when prompt is used
CREATE OR REPLACE FUNCTION increment_prompt_usage(prompt_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.saved_prompts
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = prompt_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get prompt with image count
CREATE OR REPLACE FUNCTION get_prompts_with_stats(user_uuid uuid, folder_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  title text,
  prompt_text text,
  tags text[],
  is_favorite boolean,
  usage_count integer,
  image_count bigint,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.title,
    sp.prompt_text,
    sp.tags,
    sp.is_favorite,
    sp.usage_count,
    COUNT(DISTINCT pi.image_id) as image_count,
    sp.last_used_at,
    sp.created_at
  FROM public.saved_prompts sp
  LEFT JOIN public.prompt_images pi ON sp.id = pi.prompt_id
  WHERE
    sp.user_id = user_uuid
    AND sp.is_archived = false
    AND (folder_uuid IS NULL OR sp.folder_id = folder_uuid)
  GROUP BY sp.id
  ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search prompts (full-text search)
CREATE OR REPLACE FUNCTION search_prompts(
  user_uuid uuid,
  search_query text
)
RETURNS TABLE (
  id uuid,
  title text,
  prompt_text text,
  tags text[],
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.title,
    sp.prompt_text,
    sp.tags,
    ts_rank(
      to_tsvector('english', sp.title || ' ' || sp.prompt_text || ' ' || array_to_string(sp.tags, ' ')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.saved_prompts sp
  WHERE
    sp.user_id = user_uuid
    AND sp.is_archived = false
    AND to_tsvector('english', sp.title || ' ' || sp.prompt_text || ' ' || array_to_string(sp.tags, ' '))
        @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert default "All Prompts" folder for each user (trigger)
CREATE OR REPLACE FUNCTION create_default_prompt_folder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.prompt_folders (user_id, name, is_system)
  VALUES (NEW.id, 'All Prompts', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_create_default_folder
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_prompt_folder();


-- =====================================================
-- 8. MIGRATION NOTES
-- =====================================================
--
-- To apply this schema:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify RLS policies are active
-- 3. Test with sample data
-- 4. Update application code to use new tables
--
-- Rollback plan:
-- DROP TABLE public.prompt_images CASCADE;
-- DROP TABLE public.saved_prompts CASCADE;
-- DROP TABLE public.prompt_folders CASCADE;
-- DROP FUNCTION increment_prompt_usage CASCADE;
-- DROP FUNCTION get_prompts_with_stats CASCADE;
-- DROP FUNCTION search_prompts CASCADE;
-- DROP FUNCTION create_default_prompt_folder CASCADE;
-- DROP TRIGGER on_user_created_create_default_folder ON public.user_profiles;
-- ALTER TABLE public.images DROP COLUMN saved_prompt_id;
