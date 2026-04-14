-- Track which logged-in users have accessed a private scenario via link.
-- The link IS the invitation (unlisted model from brainstorm #2).
-- Populated by get-scenario-by-slug when a non-owner authenticated user opens a private board.

CREATE TABLE IF NOT EXISTS scenario_invites (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_invites_user_id ON scenario_invites(user_id);

-- Edge Functions use the service role key which bypasses RLS.
-- RLS is enabled so the table is protected if ever accessed with the anon key.
ALTER TABLE scenario_invites ENABLE ROW LEVEL SECURITY;
