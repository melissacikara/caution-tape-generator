-- Track last edit time for tapes (architecture: tapes.updated_at for edits).

alter table public.tapes
  add column updated_at timestamptz not null default now();

update public.tapes set updated_at = created_at;

comment on column public.tapes.updated_at is 'Set on insert (default) and on each update via Edge Functions.';
