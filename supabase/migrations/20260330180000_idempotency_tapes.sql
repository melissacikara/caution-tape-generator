-- Idempotent add-tape retries (Story 2.2): same key + scenario returns same tape.

create table public.idempotency_tapes (
  idempotency_key text not null,
  scenario_id uuid not null references public.scenarios (id) on delete cascade,
  tape_id uuid not null references public.tapes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idempotency_key, scenario_id)
);

alter table public.idempotency_tapes enable row level security;
