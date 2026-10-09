-- Newsletter subscribers from the storefront footer form.

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'footer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  constraint newsletter_email_format check (position('@' in email) > 1)
);

create unique index newsletter_subscribers_email_unique on newsletter_subscribers (lower(email));

create trigger newsletter_subscribers_updated before update on newsletter_subscribers
for each row execute function set_updated_at();

create index newsletter_subscribers_recent on newsletter_subscribers (created_at desc)
  where unsubscribed_at is null;

grant select, insert, update on newsletter_subscribers to authenticated;
grant insert on newsletter_subscribers to anon;

alter table newsletter_subscribers enable row level security;

create policy newsletter_insert on newsletter_subscribers for insert
  with check (true);

create policy newsletter_staff_select on newsletter_subscribers for select
  using ((select is_staff()));

create policy newsletter_staff_update on newsletter_subscribers for update
  using ((select is_staff()))
  with check ((select is_staff()));
