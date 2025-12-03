-- =====================================================
-- Nano Banana Pro Prompts Table Migration (MVP)
-- =====================================================
-- Description: Minimal viable prompts table for gallery display
--              Focus on core functionality: browse, search, filter
-- Version: 1.0.0 (Simplified MVP)
-- Date: 2025-01-03
-- =====================================================

-- Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS prompts CASCADE;

-- =====================================================
-- 1. Create Main Table (MVP - Essential Fields Only)
-- =====================================================
CREATE TABLE prompts (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Core Content Fields
  title TEXT NOT NULL CHECK (length(title) <= 500),
  prompt TEXT NOT NULL CHECK (length(prompt) >= 10),
  image_url TEXT NOT NULL,

  -- Classification & Metadata
  tags TEXT[] DEFAULT '{}' NOT NULL,
  category TEXT DEFAULT 'Uncategorized' NOT NULL,
  author TEXT DEFAULT 'Anonymous' NOT NULL,

  -- Internationalization
  locale TEXT DEFAULT 'en' NOT NULL CHECK (locale IN ('en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'vi', 'th', 'id')),

  -- Status (simplified - only publish flag needed for MVP)
  is_published BOOLEAN DEFAULT true NOT NULL,

  -- Timestamp (simplified - only created_at for MVP)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 2. Create Indexes for Performance (MVP - Essential Only)
-- =====================================================

-- Tag filtering (GIN for array operations - most critical for tag search)
CREATE INDEX idx_prompts_tags
ON prompts USING GIN (tags)
WHERE is_published = true;

-- Composite index for primary query pattern: locale + category + recent
-- Covers the most common use case: show published prompts by locale/category sorted by date
CREATE INDEX idx_prompts_main_query
ON prompts (locale, category, is_published, created_at DESC);

-- =====================================================
-- 3. Enable Row Level Security (RLS)
-- =====================================================
-- SECURITY NOTE: This table uses public read-only access pattern
-- All data is published content, no sensitive information
-- Writes are restricted to service role only (server-side operations)

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can only READ published prompts (no writes allowed)
-- This is safe because all prompts are public gallery content
CREATE POLICY "public_read_published_prompts"
ON prompts FOR SELECT
TO public
USING (is_published = true);

-- Policy 2: Service role has full access for data management
-- Used by server-side API routes and migration scripts
-- CRITICAL: Never expose service role key to client side
CREATE POLICY "service_role_full_access"
ON prompts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4. Grant Permissions (Read-only for public)
-- =====================================================

-- Grant read access to public (controlled by RLS policy)
GRANT SELECT ON prompts TO anon;
GRANT SELECT ON prompts TO authenticated;

-- =====================================================
-- 5. Add Comments for Documentation
-- =====================================================

COMMENT ON TABLE prompts IS 'Nano Banana Pro Prompts - Public gallery of AI prompt examples (MVP)';
COMMENT ON COLUMN prompts.tags IS 'Array of tags for filtering (uses GIN index for fast array operations)';
COMMENT ON COLUMN prompts.locale IS 'Language code (en, zh, ja, ko, es, fr, de, pt, vi, th, id)';
COMMENT ON COLUMN prompts.is_published IS 'Visibility flag - only published prompts shown to public';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
--
-- FUTURE ENHANCEMENTS (when needed):
-- - Add view_count/like_count for engagement metrics
-- - Add is_featured flag for homepage highlights
-- - Add search_vector with full-text search
-- - Add updated_at with trigger for edit tracking
-- - Add get_tag_stats() function for tag cloud
-- - Add get_category_stats() function for filters
