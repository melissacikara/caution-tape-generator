-- Story 2.1: scenarios + tapes with non-guessable public_slug (FR23, NFR6).
-- Naming: architecture.md — plural tables, snake_case columns, UUID PKs.
-- Slug default: random UUID without hyphens (128-bit randomness; not sequential).

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  public_slug text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenarios_name_len check (char_length(name) <= 500)
);

comment on table public.scenarios is 'User-created scenario collections; shareable via public_slug.';
comment on column public.scenarios.public_slug is 'Non-guessable public key for URLs; app may override on insert; default is cryptographically random.';

create table public.tapes (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios (id) on delete cascade,
  tape_text text not null,
  color text not null,
  created_at timestamptz not null default now(),
  constraint tapes_tape_text_len check (char_length(tape_text) <= 2000),
  constraint tapes_color_len check (char_length(color) <= 32)
);

comment on table public.tapes is 'Caution tapes belonging to a scenario; ordered by created_at (newest-first in API).';
comment on column public.tapes.tape_text is 'Warning line text; max length aligned with Story 2.2 API limits.';
comment on column public.tapes.color is 'Tape color (e.g. hex); max length aligned with Story 2.2 API limits.';

create index idx_tapes_scenario_id_created_at on public.tapes (scenario_id, created_at desc);

-- RLS: default deny for direct client access; Edge Functions use service role (bypasses RLS).
alter table public.scenarios enable row level security;

alter table public.tapes enable row level security;
