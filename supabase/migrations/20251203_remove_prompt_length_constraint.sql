-- =====================================================
-- Nano Banana Pro Prompts Table Migration - Remove Length Constraint
-- =====================================================
-- Description: Remove strict length constraint on prompt column to allow short prompts
-- Version: 1.3.0
-- Date: 2025-12-03
-- =====================================================

-- Drop the existing constraint
ALTER TABLE prompts
DROP CONSTRAINT IF EXISTS prompts_prompt_check;

-- Add a more lenient constraint (e.g., at least 1 character)
-- or remove it entirely if empty prompts are allowed (though not recommended)
ALTER TABLE prompts
ADD CONSTRAINT prompts_prompt_check CHECK (length(prompt) >= 1);
