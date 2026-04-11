-- Add owner_id to scenarios and author_id to tapes for auth ownership (Epic 1, Story 1.1)
-- Columns are nullable — all existing Phase 1 rows remain intact with no backfill required.
-- ON DELETE SET NULL: if a user's auth record is deleted, their content becomes anonymous.

ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE tapes
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Indexes for future Epic 2 / 4 ownership queries
CREATE INDEX IF NOT EXISTS idx_scenarios_owner_id ON scenarios(owner_id);
CREATE INDEX IF NOT EXISTS idx_tapes_author_id ON tapes(author_id);
