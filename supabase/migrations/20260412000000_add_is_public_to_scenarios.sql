ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_scenarios_is_public ON scenarios(is_public) WHERE is_public = TRUE;

COMMENT ON COLUMN public.scenarios.is_public IS 'Visibility flag. FALSE = unlisted (link-access only). TRUE = listed in public feed. Default false — all new scenarios start private.';
