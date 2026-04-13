-- tape_reports: human-moderated report log for flagged public tape content.
-- Melissa reads this directly from the Supabase dashboard; no admin UI is provided.
-- All reads/writes go through the report-tape Edge Function using the service role key.
-- RLS is enabled but no client-access policies are defined intentionally.

CREATE TABLE IF NOT EXISTS tape_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tape_id      UUID        NOT NULL REFERENCES tapes(id) ON DELETE CASCADE,
  scenario_slug TEXT       NOT NULL,
  reported_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tape_reports_tape_id ON tape_reports(tape_id);

ALTER TABLE tape_reports ENABLE ROW LEVEL SECURITY;
