-- Migration: Fix deadline column issue
-- Description: Make deadline column nullable or add default value

-- Check if deadline column exists and make it nullable
ALTER TABLE challenges ALTER COLUMN deadline DROP NOT NULL;

-- Or alternatively, drop the column if it's not needed
-- ALTER TABLE challenges DROP COLUMN IF EXISTS deadline;

-- Add a comment
COMMENT ON COLUMN challenges.deadline IS 'Legacy deadline column - made nullable for compatibility'; 