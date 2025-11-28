-- =====================================================
-- Fix search_prompts_lite function - Add missing fields
-- =====================================================

-- Step 1: Drop the existing function
DROP FUNCTION IF EXISTS search_prompts_lite(uuid, text);

-- Step 2: Create the corrected function with all required fields
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
