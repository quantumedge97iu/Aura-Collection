-- One profile photo per customer. The bytes stay off the profile row so account reads stay small.
create table if not exists profile_avatars (
  customer_id uuid primary key references profiles (id) on delete cascade,
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  bytes bytea not null,
  updated_at timestamptz not null default now(),
  check (octet_length(bytes) between 32 and 1200000)
);

alter table profile_avatars enable row level security;

grant all on profile_avatars to service_role;

drop policy if exists profile_avatars_own on profile_avatars;
create policy profile_avatars_own on profile_avatars
for all to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));
