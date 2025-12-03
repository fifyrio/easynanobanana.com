-- =====================================================
-- Nano Banana Pro Prompts Table Migration - Add author_url
-- =====================================================
-- Description: Add author_url column to prompts table
-- Version: 1.1.0
-- Date: 2025-12-03
-- =====================================================

-- Add author_url column
ALTER TABLE prompts
ADD COLUMN author_url TEXT DEFAULT '';

COMMENT ON COLUMN prompts.author_url IS 'URL to the author''s profile or social media';
