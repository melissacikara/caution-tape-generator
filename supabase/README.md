# Supabase (database)

## Migrations

SQL migrations live in **`migrations/`**. The first migration creates **`scenarios`** and **`tapes`** with:

- UUID primary keys and **`public_slug`** on `scenarios` with a **random default** (non-sequential, non-guessable).
- Foreign key **`tapes.scenario_id` → `scenarios.id`** (`ON DELETE CASCADE`).
- Index **`idx_tapes_scenario_id_created_at`** for newest-first tape lists.
- **RLS** enabled on both tables (no anon policies yet; access via Edge Functions + service role in Epic 2).

## Apply locally or to a Supabase project

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. From the **repository root**: `supabase link --project-ref <your-project-ref>` (once).
3. Push migrations: `supabase db push`  
   Or run the SQL file manually in the Supabase SQL editor / `psql`.

**Note:** `gen_random_uuid()` is built into PostgreSQL / Supabase; no extra extension is required for the slug default.

## Coordinate with Story 2.2

Max lengths on `tape_text` / `color` / `name` are enforced in the DB with `CHECK` constraints; Edge Functions should use the same limits (Zod) when validating payloads.
