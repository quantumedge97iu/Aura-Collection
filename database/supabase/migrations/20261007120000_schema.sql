-- Luxe Jewels catalog and commerce schema.
-- Money is whole PKR, matching the storefront. Passwords stay in Supabase Auth.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $roles$
begin
  if to_regnamespace('auth') is null then
    create schema auth;
  end if;
  if to_regprocedure('auth.uid()') is null then
    create function auth.uid() returns uuid
    language sql stable
    as $fn$
      select coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
      )::uuid
    $fn$;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$roles$;

create type app_role as enum ('customer', 'staff', 'manager', 'admin');
create type product_status as enum ('draft', 'active', 'archived');
create type variant_status as enum ('active', 'unavailable');
create type inventory_tx_type as enum (
  'purchase', 'restock', 'sale', 'reservation', 'reservation_release',
  'adjustment', 'return', 'damage', 'manual_correction'
);
create type reservation_status as enum ('held', 'committed', 'released', 'expired');
create type order_status as enum (
  'created', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'
);
create type payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded', 'cancelled');
create type fulfillment_status as enum ('unfulfilled', 'partial', 'fulfilled', 'returned');
create type payment_method as enum ('cod', 'bank', 'card');
create type shipment_status as enum ('pending', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'exception');
create type discount_type as enum ('percent', 'fixed');
create type review_status as enum ('pending', 'published', 'rejected');

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Identity. id matches auth.users when that table exists.
create table profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  role app_role not null default 'customer',
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $fk$
begin
  if to_regclass('auth.users') is not null then
    alter table profiles
      add constraint profiles_user_fkey foreign key (id) references auth.users (id) on delete cascade;
  end if;
end
$fk$;

create trigger profiles_updated before update on profiles
for each row execute function set_updated_at();

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text not null default '',
  city text not null,
  province text not null default '',
  postal_code text not null default '',
  country char(2) not null default 'PK' check (country ~ '^[A-Z]{2}$'),
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger addresses_updated before update on addresses
for each row execute function set_updated_at();

-- One default of each kind. Lookup by customer is the address-book path.
create unique index addresses_one_default_shipping on addresses (customer_id) where is_default_shipping;
create unique index addresses_one_default_billing on addresses (customer_id) where is_default_billing;
create index addresses_customer on addresses (customer_id);

-- Catalog.
create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  subtitle text not null default '',
  image_url text,
  sort smallint not null default 0
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  subtitle text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands (id),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  sku text not null unique,
  product_type text not null,
  material text,
  metal_family text,
  gemstone text,
  purity text,
  certification text,
  weight_g numeric(8, 2) check (weight_g is null or weight_g > 0),
  dimensions text,
  status product_status not null default 'draft',
  seo_title text,
  seo_description text,
  image_url text,
  published_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(sku, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(gemstone, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(material, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(metal_family, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(purity, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(product_type, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_updated before update on products
for each row execute function set_updated_at();

-- Listing walks recent active products. Slug and sku are already unique.
create index products_active_recent on products (published_at desc, id desc) where status = 'active';
create index products_search on products using gin (search_vector);
create index products_name_trgm on products using gin (name gin_trgm_ops);

create table product_categories (
  product_id uuid not null references products (id) on delete cascade,
  category_id uuid not null references categories (id) on delete restrict,
  is_primary boolean not null default false,
  primary key (product_id, category_id)
);

create unique index product_one_primary_category on product_categories (product_id) where is_primary;
-- Category pages look up products by category, which the primary key does not serve.
create index product_categories_by_category on product_categories (category_id, product_id);

create table collection_products (
  collection_id uuid not null references collections (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  sort smallint not null default 0,
  primary key (collection_id, product_id)
);

create table product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid,
  url text not null,
  alt text not null default '',
  sort smallint not null default 0
);

create index product_media_product on product_media (product_id, sort);

create table product_details (
  product_id uuid not null references products (id) on delete cascade,
  sort smallint not null,
  body text not null,
  primary key (product_id, sort)
);

create table product_tags (
  product_id uuid not null references products (id) on delete cascade,
  tag text not null check (tag in ('new', 'bestseller', 'gift')),
  primary key (product_id, tag)
);

create index product_tags_tag on product_tags (tag, product_id);

-- Sellable unit. The storefront cart key is product + metal + size.
create table variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete restrict,
  sku text not null unique,
  barcode text unique,
  metal text not null,
  size text not null,
  color text,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= price),
  cost_price integer check (cost_price is null or cost_price >= 0),
  currency char(3) not null default 'PKR' check (currency ~ '^[A-Z]{3}$'),
  weight_g numeric(8, 2) check (weight_g is null or weight_g > 0),
  dimensions text,
  status variant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, metal, size)
);

create trigger variants_updated before update on variants
for each row execute function set_updated_at();

alter table product_media
  add constraint product_media_variant_fkey foreign key (variant_id) references variants (id) on delete cascade;

-- Metal filter on an active catalog. product_id is covered by unique (product_id, metal, size).
create index variants_metal_active on variants (metal, product_id) where status = 'active';
create index variants_metal_trgm on variants using gin (metal gin_trgm_ops);

create table inventory_levels (
  variant_id uuid primary key references variants (id) on delete restrict,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  sold integer not null default 0 check (sold >= 0),
  damaged integer not null default 0 check (damaged >= 0),
  returned integer not null default 0 check (returned >= 0),
  reorder_at integer not null default 2 check (reorder_at >= 0),
  available integer generated always as (on_hand - reserved) stored,
  updated_at timestamptz not null default now(),
  check (reserved <= on_hand)
);

create trigger inventory_levels_updated before update on inventory_levels
for each row execute function set_updated_at();

create table inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references variants (id),
  quantity integer not null check (quantity between 1 and 8),
  status reservation_status not null default 'held',
  cart_id uuid,
  order_id uuid,
  idempotency_key text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index reservations_held_variant on inventory_reservations (variant_id) where status = 'held';
create index reservations_held_expiry on inventory_reservations (expires_at) where status = 'held';
create unique index reservations_one_hold on inventory_reservations (cart_id, variant_id) where status = 'held' and cart_id is not null;

-- Append-only stock ledger. bigint keeps the index smaller than uuid at millions of rows.
create table inventory_transactions (
  id bigint generated always as identity primary key,
  variant_id uuid not null references variants (id),
  tx_type inventory_tx_type not null,
  quantity integer not null check (quantity > 0),
  on_hand_after integer not null check (on_hand_after >= 0),
  reserved_after integer not null check (reserved_after >= 0),
  reservation_id uuid references inventory_reservations (id),
  order_id uuid,
  actor_id uuid references profiles (id),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index inventory_tx_variant on inventory_transactions (variant_id, created_at desc, id desc);

create table carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid unique references profiles (id) on delete cascade,
  guest_token uuid unique,
  currency char(3) not null default 'PKR' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(customer_id, guest_token) = 1)
);

create trigger carts_updated before update on carts
for each row execute function set_updated_at();

alter table inventory_reservations
  add constraint reservations_cart_fkey foreign key (cart_id) references carts (id) on delete set null;

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  variant_id uuid not null references variants (id),
  quantity integer not null check (quantity between 1 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create trigger cart_items_updated before update on cart_items
for each row execute function set_updated_at();

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table wishlist_items (
  wishlist_id uuid not null references wishlists (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create table coupons (
  code text primary key check (code ~ '^[A-Z0-9-]{4,32}$'),
  discount_type discount_type not null,
  amount integer not null check (amount > 0),
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  max_discount integer check (max_discount is null or max_discount > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer not null default 1 check (per_customer_limit > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (discount_type <> 'percent' or amount <= 100),
  check (ends_at is null or ends_at > starts_at)
);

create table coupon_products (
  code text not null references coupons (code) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  primary key (code, product_id)
);

create table coupon_categories (
  code text not null references coupons (code) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  primary key (code, category_id)
);

create sequence order_number_seq start with 10000;

create table orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer_id uuid references profiles (id),
  email text not null,
  status order_status not null default 'created',
  payment_status payment_status not null default 'pending',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  currency char(3) not null default 'PKR' check (currency ~ '^[A-Z]{3}$'),
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  shipping_fee integer not null default 0 check (shipping_fee >= 0),
  tax integer not null default 0 check (tax >= 0),
  total integer not null check (total >= 0),
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  billing_address jsonb not null check (jsonb_typeof(billing_address) = 'object'),
  notes text not null default '',
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total = subtotal - discount + shipping_fee + tax),
  check (discount <= subtotal)
);

create trigger orders_updated before update on orders
for each row execute function set_updated_at();

alter table inventory_reservations
  add constraint reservations_order_fkey foreign key (order_id) references orders (id);

alter table inventory_transactions
  add constraint inventory_tx_order_fkey foreign key (order_id) references orders (id);

-- Customer order history. Open-order queues use status.
create index orders_customer_recent on orders (customer_id, created_at desc) where customer_id is not null;
create index orders_open on orders (status, created_at desc) where status in ('created', 'confirmed', 'processing', 'shipped');

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete restrict,
  product_id uuid references products (id) on delete restrict,
  variant_id uuid references variants (id) on delete restrict,
  sku text not null,
  product_name text not null,
  variant_label text not null,
  image_url text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 8),
  discount integer not null default 0 check (discount >= 0),
  tax integer not null default 0 check (tax >= 0),
  total integer not null check (total >= 0),
  check (total = unit_price * quantity - discount + tax)
);

create index order_items_order on order_items (order_id);

create table order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references orders (id) on delete restrict,
  old_status order_status,
  new_status order_status not null,
  actor_id uuid references profiles (id),
  source text not null default 'system',
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index order_status_history_order on order_status_history (order_id, created_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete restrict,
  provider text not null check (provider ~ '^[a-z0-9_]+$'),
  method payment_method not null,
  provider_ref text,
  idempotency_key text not null unique,
  amount integer not null check (amount >= 0),
  currency char(3) not null default 'PKR' check (currency ~ '^[A-Z]{3}$'),
  status payment_status not null default 'pending',
  card_last4 char(4) check (card_last4 is null or card_last4 ~ '^[0-9]{4}$'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payments_updated before update on payments
for each row execute function set_updated_at();

create unique index payments_provider_ref on payments (provider, provider_ref) where provider_ref is not null;
create index payments_order on payments (order_id);

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references coupons (code),
  customer_id uuid references profiles (id),
  order_id uuid not null unique references orders (id),
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index coupon_redemptions_customer on coupon_redemptions (code, customer_id);

create table shipping_zones (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table shipping_zone_cities (
  zone_id uuid not null references shipping_zones (id) on delete cascade,
  city text not null,
  province text not null default '',
  transit_days smallint not null check (transit_days between 0 and 30),
  primary key (zone_id, city),
  unique (city)
);

create table shipping_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true
);

create table shipping_rates (
  method_id uuid not null references shipping_methods (id) on delete cascade,
  zone_id uuid not null references shipping_zones (id) on delete cascade,
  fee integer not null check (fee >= 0),
  free_over integer check (free_over is null or free_over >= 0),
  primary key (method_id, zone_id)
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete restrict,
  method_id uuid references shipping_methods (id),
  carrier text not null default '',
  tracking text unique,
  status shipment_status not null default 'pending',
  eta timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shipments_updated before update on shipments
for each row execute function set_updated_at();

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  customer_id uuid not null references profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null default '',
  body text not null,
  verified boolean not null default false,
  status review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, customer_id)
);

create trigger reviews_updated before update on reviews
for each row execute function set_updated_at();

create index reviews_published on reviews (product_id, created_at desc) where status = 'published';

create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  summary text not null default ''
);

create index audit_entity on audit_log (entity, entity_id, at desc);
create index audit_recent on audit_log (at desc);

-- Redis key versions. The database does not talk to Redis; the backend reads this and drops keys.
create table cache_versions (
  key text primary key,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

insert into cache_versions (key) values ('catalog');
