-- =====================================================
-- Migration: Add Italian locale to prompts table
-- Description: Updates locale check constraint to include `it`
-- Date: 2025-12-05
-- =====================================================

ALTER TABLE prompts
  DROP CONSTRAINT IF EXISTS prompts_locale_check;

ALTER TABLE prompts
  ADD CONSTRAINT prompts_locale_check
  CHECK (locale IN ('en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'vi', 'th', 'id', 'it'));

-- =====================================================
-- END OF MIGRATION
-- =====================================================
