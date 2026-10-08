-- LOCAL BENCHMARK ONLY. Do not run this against production.
-- Adds an active bench catalog so query plans are measured past a handful of rows.
-- House SKUs (LJ-) are not modified. Bench orders are read-path fixtures, not checkout sales.

insert into products (
  brand_id, slug, name, description, sku, product_type, material, metal_family, gemstone, purity,
  certification, status, image_url, published_at
)
select b.id,
  'bench-' || lpad(g::text, 6, '0'),
  'Bench Stone ' || g,
  'Bench catalog row ' || g || ' for query planning.',
  'BN-' || lpad(g::text, 6, '0'),
  (array['ring','earring','necklace','bracelet','bangle'])[1 + (g % 5)],
  'Gold',
  'Gold',
  (array['Diamond','Pearl','Sapphire'])[1 + (g % 3)],
  '18K',
  'Hallmarked',
  'active',
  '/media/ring-royal.jpg',
  now() - make_interval(mins => g)
from generate_series(1, 8000) g
cross join brands b
where b.slug = 'luxe-jewels';

insert into product_categories (product_id, category_id, is_primary)
select p.id, c.id, true
from products p
join categories c on c.sort = 1 + (abs(hashtext(p.slug)) % 10)
where p.slug like 'bench-%';

insert into variants (product_id, sku, metal, size, price, currency, status)
select p.id, p.sku || '-' || m.code || '-OS', m.metal, 'One size', 25000, 'PKR', 'active'
from products p
cross join (values ('YG', 'Yellow Gold'), ('RG', 'Rose Gold'), ('WG', 'White Gold')) as m(code, metal)
where p.slug like 'bench-%';

insert into inventory_levels (variant_id, on_hand, reorder_at)
select v.id, 10, 2
from variants v
where v.sku like 'BN-%';

insert into profiles (id, full_name, phone, role)
select gen_random_uuid(), 'Bench Customer ' || g, '03000000000', 'customer'
from generate_series(1, 2000) g;

with cust as (
  select id, row_number() over (order by id) as n
  from profiles
  where full_name like 'Bench Customer %'
)
insert into orders (
  number, customer_id, email, status, payment_status, fulfillment_status,
  subtotal, discount, shipping_fee, tax, total,
  shipping_address, billing_address, idempotency_key, created_at
)
select 'BN-' || lpad(g::text, 6, '0'),
  c.id,
  'bench' || g || '@example.com',
  'delivered', 'paid', 'fulfilled',
  25000, 0, 0, 0, 25000,
  '{"name":"Bench","phone":"03000000000","email":"bench@example.com","city":"Karachi","address":"Bench street","notes":""}'::jsonb,
  '{"name":"Bench","phone":"03000000000","email":"bench@example.com","city":"Karachi","address":"Bench street","notes":""}'::jsonb,
  'bench-order-' || g,
  now() - make_interval(mins => g)
from generate_series(1, 4000) g
join cust c on c.n = 1 + (g % 2000);

insert into order_items (order_id, product_id, variant_id, sku, product_name, variant_label, unit_price, quantity, total)
select o.id, v.product_id, v.id, v.sku, p.name, v.metal || ' / ' || v.size, v.price, 1, v.price
from orders o
join variants v on v.sku = 'BN-' || lpad((1 + (substring(o.number from 4)::int % 8000))::text, 6, '0') || '-YG-OS'
join products p on p.id = v.product_id
where o.number like 'BN-%';

insert into order_status_history (order_id, old_status, new_status, source)
select id, null, 'delivered', 'bench'
from orders
where number like 'BN-%';

with cust as (
  select id, row_number() over (order by id) as n
  from profiles where full_name like 'Bench Customer %'
),
prod as (
  select id, row_number() over (order by slug) as n
  from products where slug like 'bench-%'
)
insert into reviews (product_id, customer_id, rating, title, body, status)
select p.id, c.id, 4, 'Noted', 'Worn twice and the clasp stayed shut.', 'published'
from cust c
join prod p on p.n = c.n;

analyze;
