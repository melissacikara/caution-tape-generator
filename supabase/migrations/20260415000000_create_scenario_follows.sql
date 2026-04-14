-- Public scenarios a user has chosen to follow (bookmark). Writes ship in Epic 7.3; this migration supports the read path (library Following bucket).

CREATE TABLE IF NOT EXISTS scenario_follows (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_follows_user_id ON scenario_follows(user_id);

-- Edge Functions use the service role key which bypasses RLS.
-- RLS is enabled so the table is protected if ever accessed with the anon key.
ALTER TABLE scenario_follows ENABLE ROW LEVEL SECURITY;
