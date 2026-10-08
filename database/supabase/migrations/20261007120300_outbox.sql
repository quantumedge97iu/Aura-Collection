-- Events committed with the business change. The worker delivers them later.
-- Postgres remains the source of truth. Redis Streams is only a copy for consumers.

create table outbox (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name ~ '^[a-z0-9_.]+$'),
  aggregate_id uuid,
  dedupe_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'dead')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index outbox_ready on outbox (available_at, created_at)
  where status in ('pending', 'processing');

alter table outbox enable row level security;
alter table outbox force row level security;

revoke all on outbox from public, anon, authenticated;
grant select, insert, update on outbox to service_role;
