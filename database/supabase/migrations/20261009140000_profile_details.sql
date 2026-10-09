-- The account form collects email, home address, and a photo.
-- Those belong on the profile row itself, not only in side tables.

alter table profiles add column if not exists email text;
alter table profiles add column if not exists home_line1 text;
alter table profiles add column if not exists home_line2 text not null default '';
alter table profiles add column if not exists home_city text;
alter table profiles add column if not exists home_province text not null default '';
alter table profiles add column if not exists home_postal_code text not null default '';
alter table profiles add column if not exists home_country char(2);
alter table profiles add column if not exists avatar_mime text;

create unique index if not exists profiles_email on profiles (lower(email)) where email is not null;

create or replace function refresh_profile_home(target uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  home addresses%rowtype;
begin
  select * into home
  from addresses
  where customer_id = target
  order by is_default_shipping desc, created_at desc
  limit 1;
  if not found then
    update profiles
    set home_line1 = null, home_line2 = '', home_city = null, home_province = '', home_postal_code = '', home_country = null
    where id = target;
    return;
  end if;
  update profiles
  set home_line1 = home.line1,
      home_line2 = home.line2,
      home_city = home.city,
      home_province = home.province,
      home_postal_code = home.postal_code,
      home_country = home.country
  where id = target;
end
$$;

create or replace function touch_profile_home() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform refresh_profile_home(coalesce(new.customer_id, old.customer_id));
  return coalesce(new, old);
end
$$;

drop trigger if exists addresses_profile_home on addresses;
create trigger addresses_profile_home
after insert or update or delete on addresses
for each row execute function touch_profile_home();

create or replace function touch_profile_photo() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update profiles set avatar_url = null, avatar_mime = null where id = old.customer_id;
    return old;
  end if;
  update profiles set avatar_url = '/v1/me/avatar', avatar_mime = new.mime where id = new.customer_id;
  return new;
end
$$;

drop trigger if exists avatars_profile_photo on profile_avatars;
create trigger avatars_profile_photo
after insert or update or delete on profile_avatars
for each row execute function touch_profile_photo();

do $$
begin
  if to_regclass('auth.users') is not null then
    update profiles p
    set email = lower(u.email)
    from auth.users u
    where u.id = p.id and u.email is not null and (p.email is null or p.email = '');
  end if;
end
$$;

select refresh_profile_home(id) from profiles;

update profiles p
set avatar_url = '/v1/me/avatar', avatar_mime = a.mime
from profile_avatars a
where a.customer_id = p.id;
