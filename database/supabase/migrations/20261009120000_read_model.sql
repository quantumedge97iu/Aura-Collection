-- Listing read model and the lookups a large catalog actually uses.
-- Shop pages read product_cards (one index range) and then live stock for that page only.
-- Price, rating, category, tags, and metals stay on the card so a filter does not scan every variant.

create table if not exists product_cards (
  product_id uuid primary key references products (id) on delete cascade,
  slug text not null,
  name text not null,
  image_url text,
  published_at timestamptz not null,
  status product_status not null,
  brand_name text not null default '',
  min_price integer,
  category_slug text,
  tags text[] not null default '{}',
  metals text[] not null default '{}',
  rating numeric(3, 1) not null default 0,
  review_count integer not null default 0,
  default_variant jsonb
);

create unique index if not exists product_cards_slug on product_cards (slug);
create index if not exists product_cards_active_recent on product_cards (published_at desc, product_id desc) where status = 'active';
create index if not exists product_cards_category_recent on product_cards (category_slug, published_at desc, product_id desc) where status = 'active';
create index if not exists product_cards_price on product_cards (min_price, published_at desc, product_id desc) where status = 'active' and min_price is not null;
create index if not exists product_cards_rating on product_cards (rating desc, published_at desc, product_id desc) where status = 'active';
create index if not exists product_cards_tags on product_cards using gin (tags) where status = 'active';
create index if not exists product_cards_metals on product_cards using gin (metals) where status = 'active';

create or replace function refresh_product_card(target uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into product_cards (
    product_id, slug, name, image_url, published_at, status, brand_name, min_price,
    category_slug, tags, metals, rating, review_count, default_variant
  )
  select p.id, p.slug, p.name, p.image_url, p.published_at, p.status,
    coalesce((select b.name from brands b where b.id = p.brand_id), ''),
    (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active'),
    (select c.slug from product_categories pc join categories c on c.id = pc.category_id where pc.product_id = p.id and pc.is_primary),
    coalesce((select array_agg(t.tag order by t.tag) from product_tags t where t.product_id = p.id), '{}'::text[]),
    coalesce((select array_agg(distinct v.metal order by v.metal) from variants v where v.product_id = p.id and v.status = 'active'), '{}'::text[]),
    coalesce((select round(avg(r.rating)::numeric, 1) from reviews r where r.product_id = p.id and r.status = 'published'), 0),
    coalesce((select count(*) from reviews r where r.product_id = p.id and r.status = 'published'), 0),
    (select jsonb_build_object('id', v.id, 'sku', v.sku, 'metal', v.metal, 'size', v.size, 'price', v.price)
     from variants v
     where v.product_id = p.id and v.status = 'active'
     order by v.price, v.metal, v.size
     limit 1)
  from products p
  where p.id = target
  on conflict (product_id) do update set
    slug = excluded.slug,
    name = excluded.name,
    image_url = excluded.image_url,
    published_at = excluded.published_at,
    status = excluded.status,
    brand_name = excluded.brand_name,
    min_price = excluded.min_price,
    category_slug = excluded.category_slug,
    tags = excluded.tags,
    metals = excluded.metals,
    rating = excluded.rating,
    review_count = excluded.review_count,
    default_variant = excluded.default_variant;
end
$$;

create or replace function touch_product_card() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from product_cards where product_id = old.id;
    return old;
  end if;
  perform refresh_product_card(new.id);
  return new;
end
$$;

create or replace function touch_product_card_child() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.product_id, old.product_id);
  if target is not null then
    perform refresh_product_card(target);
  end if;
  return coalesce(new, old);
end
$$;

create or replace function touch_cards_for_brand() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform refresh_product_card(p.id) from products p where p.brand_id = new.id;
  return new;
end
$$;

drop trigger if exists products_card on products;
create trigger products_card after insert or update or delete on products
for each row execute function touch_product_card();

drop trigger if exists variants_card on variants;
create trigger variants_card after insert or update or delete on variants
for each row execute function touch_product_card_child();

drop trigger if exists tags_card on product_tags;
create trigger tags_card after insert or update or delete on product_tags
for each row execute function touch_product_card_child();

drop trigger if exists categories_card on product_categories;
create trigger categories_card after insert or update or delete on product_categories
for each row execute function touch_product_card_child();

drop trigger if exists reviews_card on reviews;
create trigger reviews_card after insert or update or delete on reviews
for each row execute function touch_product_card_child();

drop trigger if exists brands_card on brands;
create trigger brands_card after update of name on brands
for each row execute function touch_cards_for_brand();

select refresh_product_card(id) from products;

-- Account, admin, and homepage paths that grow with customers, not with one page of products.
create index if not exists reviews_published_recent on reviews (created_at desc, id desc) where status = 'published';
create index if not exists orders_recent on orders (created_at desc, id desc);
create index if not exists profiles_recent on profiles (created_at desc, id desc);
create index if not exists addresses_customer_created on addresses (customer_id, created_at, id);
create index if not exists wishlist_items_recent on wishlist_items (wishlist_id, created_at desc);
create index if not exists payments_order_recent on payments (order_id, created_at desc, id desc);
create index if not exists collection_products_order on collection_products (collection_id, sort, product_id);

drop index if exists addresses_customer;

-- Inbox. The browser never reads these tables.
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (position('@' in email) > 1),
  created_at timestamptz not null default now()
);

create unique index if not exists subscribers_email on subscribers (lower(email));
create index if not exists subscribers_recent on subscribers (created_at desc);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null check (position('@' in email) > 1),
  body text not null check (char_length(body) between 10 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_recent on contact_messages (created_at desc, id desc);

alter table product_cards enable row level security;
alter table subscribers enable row level security;
alter table contact_messages enable row level security;

grant select on product_cards to anon, authenticated;
grant all on product_cards, subscribers, contact_messages to service_role;

drop policy if exists product_cards_public_read on product_cards;
create policy product_cards_public_read on product_cards
for select to anon, authenticated
using (status = 'active');
