-- Epic 7.1: per-user unread activity for scenarios (quiet badge backend).

CREATE TABLE IF NOT EXISTS scenario_user_unread (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  has_unread  boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_user_unread_user_unread
  ON scenario_user_unread (user_id)
  WHERE has_unread = true;

-- Edge Functions use the service role key which bypasses RLS.
-- RLS is enabled so the table is protected if ever accessed with the anon key.
ALTER TABLE scenario_user_unread ENABLE ROW LEVEL SECURITY;
