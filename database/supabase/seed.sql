-- Catalog mapped from the storefront. Prices are whole PKR. Safe to run on an empty database.

create temporary table seed_product (
  ord smallint,
  slug text,
  name text,
  price integer,
  sku text,
  category text,
  appears text[],
  tags text[],
  metals text[],
  sizes text[],
  image text,
  description text,
  product_type text,
  gemstone text,
  purity text,
  weight numeric,
  certification text,
  details text[]
);

insert into seed_product values
(1, 'royal-sparkle-ring', 'Royal Sparkle Ring', 48500, 'LJ-RG-048', 'rings', array['diamonds'], array['new'], array['Yellow Gold','Rose Gold','White Gold'], array['12','14','16','18','20'], '/media/ring-royal.jpg', 'A diamond halo around a brilliant center, on a fine gold band. Made for proposals, anniversaries, and days with no occasion at all.', 'ring', 'Diamond', '18K', 3.20, 'Hallmarked', array['Brilliant center with a pavé halo','Polished gold band','Hallmarked metal','Arrives in an Auraloomdimond box']),
(2, 'golden-drops-earrings', 'Golden Drops Earrings', 32000, 'LJ-ER-032', 'earrings', array['bridal'], array['new','gift'], array['Yellow Gold','Rose Gold','White Gold'], array['One size'], '/media/earrings-drops.jpg', 'Chandelier drops in yellow gold, set with stones that catch light when you turn. Light enough for a long evening.', 'earring', 'Diamond', '18K', 4.10, 'Hallmarked', array['Pierced ears','Secure butterfly back','Hallmarked gold','Gift boxed']),
(3, 'eternal-grace-necklace', 'Eternal Grace Necklace', 78000, 'LJ-NK-078', 'necklaces', array['bridal'], array['new'], array['Yellow Gold','Rose Gold','White Gold'], array['16"','18"','20"'], '/media/necklace-pendant.jpg', 'A teardrop pendant on a fine gold chain. It sits at the collarbone and works alone or over a neckline.', 'necklace', 'Diamond', '18K', 5.40, 'Hallmarked', array['Adjustable length','Diamond teardrop pendant','Hallmarked gold','Lobster clasp']),
(4, 'diamond-cut-bracelet', 'Diamond Cut Bracelet', 41500, 'LJ-BR-041', 'bracelets', array['diamonds'], array['new','gift'], array['Yellow Gold','Rose Gold','White Gold'], array['6.5"','7"','7.5"'], '/media/bracelet-diamond.jpg', 'A continuous line of round diamonds in gold. Worn alone, it reads as one clean streak of light.', 'bracelet', 'Diamond', '18K', 8.20, 'Hallmarked', array['Tennis setting','Box clasp with safety latch','Hallmarked gold','Gift boxed']),
(5, 'classic-solitaire-ring', 'Classic Solitaire Ring', 65000, 'LJ-RG-065', 'rings', array['diamonds'], array['bestseller'], array['Yellow Gold','Rose Gold','White Gold'], array['12','14','16','18','20'], '/media/ring-solitaire.jpg', 'One stone, four prongs, a plain gold shank. The house solitaire, kept deliberately quiet.', 'ring', 'Diamond', '18K', 2.80, 'Hallmarked', array['Four-prong setting','Comfort-fit band','Hallmarked gold','Sizing available within 7 days']),
(6, 'pearl-drop-earrings', 'Pearl Drop Earrings', 26500, 'LJ-ER-026', 'earrings', null, array['bestseller','gift'], array['Yellow Gold','White Gold'], array['One size'], '/media/earrings-pearl.jpg', 'A single pearl suspended from a small diamond cap. The pair most often chosen as a first fine gift.', 'earring', 'Pearl', '18K', 3.50, 'Hallmarked', array['Freshwater pearl drops','Diamond cap','Hallmarked gold','Gift boxed']),
(7, 'floral-pendant-necklace', 'Floral Pendant Necklace', 52000, 'LJ-NK-052', 'necklaces', null, array['bestseller','gift'], array['Yellow Gold','Rose Gold','White Gold'], array['16"','18"','20"'], '/media/necklace-floral.jpg', 'A small gold flower, pavé set, on a chain you can sleep in. Designed to be the piece that never comes off.', 'necklace', 'Diamond', '18K', 3.10, 'Hallmarked', array['Floral pavé pendant','Fine cable chain','Hallmarked gold','Extendable clasp']),
(8, 'gold-bangle-set', 'Gold Bangle Set', 72000, 'LJ-BG-072', 'bangles', array['bridal','gold'], array['bestseller'], array['Yellow Gold','Rose Gold'], array['2.4','2.6','2.8'], '/media/bangles-gold.jpg', 'Three polished bangles, one with a diamond row. Sold as a set, meant to be stacked.', 'bangle', 'Diamond', '22K', 18.00, 'Hallmarked', array['Set of three','Diamond row on the center bangle','Hallmarked gold','Hinge opening on the diamond bangle']),
(9, 'noor-bridal-choker', 'Noor Bridal Choker', 145000, 'LJ-BD-145', 'bridal', null, null, array['Yellow Gold','Rose Gold'], array['One size'], '/media/bridal-choker.jpg', 'An ornate gold choker for the ceremony. Stones and pearls sit close to the throat, with enough presence for a bare neckline.', 'bridal', 'Pearl', '22K', 42.00, 'Hallmarked', array['Choker length','Stone and pearl setting','Hallmarked gold','Made to order in 10 days if resizing is needed']),
(10, 'heritage-signet-ring', 'Heritage Signet Ring', 38000, 'LJ-MN-038', 'men', array['rings'], null, array['Yellow Gold','Rose Gold'], array['16','18','20','22','24'], '/media/ring-signet.jpg', 'A heavy signet with a smooth oval face. The face is left plain so it can be engraved after purchase.', 'ring', null, '22K', 8.50, 'Hallmarked', array['Solid gold face','Engraving available on request','Hallmarked gold','Wider comfort band']),
(11, 'aurum-gold-bar', 'Aurum 24K Gold Bar', 185000, 'LJ-GB-185', 'gold', null, null, array['24K'], array['5g'], '/media/gold-bars.jpg', 'A 5 gram 24K bar from the house reserve. Insured delivery, sealed, with the assay card in the box.', 'bar', null, '24K', 5.00, 'Assay card', array['5 grams','24 karat','Sealed with assay card','Insured nationwide delivery']),
(12, 'lumiere-diamond-studs', 'Lumière Diamond Studs', 96000, 'LJ-DM-096', 'diamonds', array['earrings'], array['gift'], array['White Gold','Yellow Gold'], array['One size'], '/media/diamond-stud.jpg', 'A matched pair of round brilliants in a low four-prong setting. The stud that replaces every other pair.', 'earring', 'Diamond', '18K', 1.80, 'Hallmarked', array['Matched round brilliants','Low prong setting','Hallmarked gold','Screw or push backing on request']),
(13, 'sovereign-gold-chain', 'Sovereign Gold Chain', 61000, 'LJ-MN-061', 'men', array['necklaces','gold'], null, array['Yellow Gold'], array['20"','22"','24"'], '/media/chain-men.jpg', 'A curb chain with weight you can feel. Polished, not plated, and finished with a solid lobster clasp.', 'chain', null, '22K', 22.00, 'Hallmarked', array['Curb links','Yellow gold','Hallmarked','Solid lobster clasp']);

insert into brands (slug, name) values ('luxe-jewels', 'Auraloomdimond');

insert into categories (slug, label, subtitle, image_url, sort) values
('rings', 'Rings', 'Solitaires, halos, and bands finished for every day.', '/media/ring-royal.jpg', 1),
('earrings', 'Earrings', 'Drops, studs, and pearls with a quiet shine.', '/media/earrings-drops.jpg', 2),
('necklaces', 'Necklaces', 'Pendants and chains that sit close to the collarbone.', '/media/necklace-pendant.jpg', 3),
('bracelets', 'Bracelets', 'Tennis lines and fine gold cuffs.', '/media/bracelet-diamond.jpg', 4),
('bangles', 'Bangles', 'Stacked gold, made to be worn together.', '/media/bangles-gold.jpg', 5),
('bridal', 'Bridal', 'Ceremony sets for the vows and the celebrations after.', '/media/bridal-choker.jpg', 6),
('men', 'Men', 'Signets and chains with a heavier hand.', '/media/ring-signet.jpg', 7),
('gold', 'Gold', 'Hallmarked gold, from wearable pieces to reserve bars.', '/media/gold-bars.jpg', 8),
('diamonds', 'Diamonds', 'Stones chosen for cut, then set in gold.', '/media/diamond-stud.jpg', 9),
('gifts', 'Gifts', 'Pieces ready to give, across every budget.', '/media/earrings-pearl.jpg', 10);

insert into products (
  brand_id, slug, name, description, sku, product_type, material, metal_family, gemstone, purity,
  certification, weight_g, status, seo_title, image_url, published_at
)
select b.id, s.slug, s.name, s.description, s.sku, s.product_type, 'Gold', 'Gold', s.gemstone, s.purity,
  s.certification, s.weight, 'active', s.name, s.image, now() - make_interval(days => s.ord)
from seed_product s
cross join brands b
where b.slug = 'luxe-jewels';

insert into product_categories (product_id, category_id, is_primary)
select p.id, c.id, true
from seed_product s
join products p on p.slug = s.slug
join categories c on c.slug = s.category;

insert into product_categories (product_id, category_id, is_primary)
select p.id, c.id, false
from seed_product s
join products p on p.slug = s.slug
cross join lateral unnest(s.appears) as extra(slug)
join categories c on c.slug = extra.slug;

insert into product_tags (product_id, tag)
select p.id, t.tag
from seed_product s
join products p on p.slug = s.slug
cross join lateral unnest(s.tags) as t(tag);

insert into product_details (product_id, sort, body)
select p.id, d.ord::smallint, d.body
from seed_product s
join products p on p.slug = s.slug
cross join lateral unnest(s.details) with ordinality as d(body, ord);

insert into product_media (product_id, url, alt, sort)
select p.id, s.image, s.name, 0
from seed_product s
join products p on p.slug = s.slug;

insert into variants (product_id, sku, metal, size, price, cost_price, currency, weight_g, status)
select p.id,
  s.sku || '-' || case m.metal
    when 'Yellow Gold' then 'YG'
    when 'Rose Gold' then 'RG'
    when 'White Gold' then 'WG'
    when '24K' then '24K'
  end || '-' || regexp_replace(sz.size, '[^A-Za-z0-9]', '', 'g'),
  m.metal, sz.size, s.price, (s.price * 55 / 100), 'PKR', s.weight, 'active'
from seed_product s
join products p on p.slug = s.slug
cross join lateral unnest(s.metals) as m(metal)
cross join lateral unnest(s.sizes) as sz(size);

insert into inventory_levels (variant_id, on_hand, reorder_at)
select v.id, case when p.sku = 'LJ-BD-145' then 3 when p.sku = 'LJ-GB-185' then 12 else 8 end, 2
from variants v
join products p on p.id = v.product_id;

insert into inventory_transactions (variant_id, tx_type, quantity, on_hand_after, reserved_after, note)
select variant_id, 'purchase', on_hand, on_hand, 0, 'opening stock'
from inventory_levels;

insert into collections (slug, title, subtitle, image_url) values
('bridal-edit', 'Bridal Edit', 'Chokers, drops, and stacks for the wedding week.', '/media/bridal-choker.jpg'),
('diamond-house', 'Diamond House', 'Solitaires, studs, and lines of white light.', '/media/diamond-stud.jpg'),
('mens-atelier', 'Men''s Atelier', 'Signets and chains with a heavier hand.', '/media/chain-men.jpg'),
('gift-edit', 'The Gift Edit', 'Boxed and ready, from pearls to a full diamond stud.', '/media/earrings-pearl.jpg'),
('gold-reserve', 'Gold Reserve', 'Wearable gold and a sealed 24K bar.', '/media/gold-bars.jpg');

insert into collection_products (collection_id, product_id, sort)
select c.id, p.id, cp.ord::smallint
from (values
  ('bridal-edit', 'noor-bridal-choker', 1),
  ('bridal-edit', 'eternal-grace-necklace', 2),
  ('bridal-edit', 'golden-drops-earrings', 3),
  ('bridal-edit', 'gold-bangle-set', 4),
  ('diamond-house', 'classic-solitaire-ring', 1),
  ('diamond-house', 'lumiere-diamond-studs', 2),
  ('diamond-house', 'diamond-cut-bracelet', 3),
  ('diamond-house', 'royal-sparkle-ring', 4),
  ('mens-atelier', 'heritage-signet-ring', 1),
  ('mens-atelier', 'sovereign-gold-chain', 2),
  ('mens-atelier', 'aurum-gold-bar', 3),
  ('gift-edit', 'pearl-drop-earrings', 1),
  ('gift-edit', 'floral-pendant-necklace', 2),
  ('gift-edit', 'golden-drops-earrings', 3),
  ('gift-edit', 'lumiere-diamond-studs', 4),
  ('gold-reserve', 'aurum-gold-bar', 1),
  ('gold-reserve', 'gold-bangle-set', 2),
  ('gold-reserve', 'sovereign-gold-chain', 3),
  ('gold-reserve', 'heritage-signet-ring', 4)
) as cp(collection, slug, ord)
join collections c on c.slug = cp.collection
join products p on p.slug = cp.slug;

insert into shipping_zones (code, name) values ('pk', 'Pakistan');

insert into shipping_zone_cities (zone_id, city, province, transit_days)
select z.id, c.city, c.province, c.days
from shipping_zones z
cross join (values
  ('Karachi', 'Sindh', 1),
  ('Hyderabad', 'Sindh', 2),
  ('Lahore', 'Punjab', 3),
  ('Faisalabad', 'Punjab', 3),
  ('Islamabad', 'Islamabad Capital Territory', 3),
  ('Rawalpindi', 'Punjab', 3),
  ('Sialkot', 'Punjab', 3),
  ('Multan', 'Punjab', 4),
  ('Peshawar', 'Khyber Pakhtunkhwa', 4),
  ('Quetta', 'Balochistan', 5)
) as c(city, province, days)
where z.code = 'pk';

insert into shipping_methods (code, name) values ('standard', 'Insured delivery');

insert into shipping_rates (method_id, zone_id, fee)
select m.id, z.id, 0
from shipping_methods m
cross join shipping_zones z
where m.code = 'standard' and z.code = 'pk';

insert into coupons (code, discount_type, amount, min_subtotal, max_discount, usage_limit, per_customer_limit)
values ('WELCOME10', 'percent', 10, 20000, 8000, 1000, 1);

drop table seed_product;
