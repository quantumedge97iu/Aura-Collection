import type { Db } from "../db";
import { rows } from "../db";

const card = `
  p.id, p.slug, p.name, p.image_url, p.published_at,
  (select b.name from brands b where b.id = p.brand_id) as brand,
  (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active') as price,
  (select c.slug from product_categories pc join categories c on c.id = pc.category_id where pc.product_id = p.id and pc.is_primary) as category,
  coalesce((select json_agg(t.tag) from product_tags t where t.product_id = p.id), '[]'::json) as tags,
  coalesce((select json_agg(distinct v.metal) from variants v where v.product_id = p.id and v.status = 'active'), '[]'::json) as metals,
  coalesce((select round(avg(r.rating)::numeric, 1) from reviews r where r.product_id = p.id and r.status = 'published'), 0) as rating,
  coalesce((select count(*) from reviews r where r.product_id = p.id and r.status = 'published'), 0) as review_count,
  (select json_build_object('id', v.id, 'sku', v.sku, 'metal', v.metal, 'size', v.size, 'price', v.price, 'available', i.available)
   from variants v join inventory_levels i on i.variant_id = v.id
   where v.product_id = p.id and v.status = 'active'
   order by v.price, v.metal, v.size limit 1) as default_variant
`;

export async function catalogVersion(db: Db) {
  const found = await rows<{ version: number }>(db, "select version from cache_versions where key = 'catalog'");
  return found[0]?.version ?? 1;
}

export async function listProducts(db: Db, input: {
  category: string | null;
  tag: string | null;
  metal: string | null;
  limit: number;
  cursorAt: string | null;
  cursorId: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: string | null;
}) {
  return rows(db, `
    select ${card}
    from products p
    where p.status = 'active'
      and ($1::text is null or exists (
        select 1 from product_categories pc join categories c on c.id = pc.category_id
        where pc.product_id = p.id and c.slug = $1
      ))
      and ($2::text is null or exists (select 1 from product_tags t where t.product_id = p.id and t.tag = $2))
      and ($3::text is null or exists (
        select 1 from variants v where v.product_id = p.id and v.metal = $3 and v.status = 'active'
      ))
      and ($4::timestamptz is null or (p.published_at, p.id) < ($4::timestamptz, $5::uuid))
      and ($7::int is null or (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active') >= $7)
      and ($8::int is null or (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active') <= $8)
    order by
      case when $9 = 'price-asc' then (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active') end asc nulls last,
      case when $9 = 'price-desc' then (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active') end desc nulls last,
      case when $9 = 'rating' then (select avg(r.rating) from reviews r where r.product_id = p.id and r.status = 'published') end desc nulls last,
      p.published_at desc, p.id desc
    limit $6
  `, [input.category, input.tag, input.metal, input.cursorAt, input.cursorId, input.limit, input.minPrice, input.maxPrice, input.sort]);
}

export async function listingMetals(db: Db, category: string | null, tag: string | null) {
  const found = await rows<{ metal: string }>(db, `
    select distinct v.metal
    from variants v
    join products p on p.id = v.product_id
    where p.status = 'active' and v.status = 'active'
      and ($1::text is null or exists (
        select 1 from product_categories pc join categories c on c.id = pc.category_id
        where pc.product_id = p.id and c.slug = $1
      ))
      and ($2::text is null or exists (select 1 from product_tags t where t.product_id = p.id and t.tag = $2))
    order by v.metal
  `, [category, tag]);
  return found.map((row) => row.metal);
}

export async function searchProducts(db: Db, query: string, like: string, limit: number) {
  return rows(db, `
    select ${card}
    from products p
    where p.status = 'active'
      and (
        p.search_vector @@ plainto_tsquery('simple', $1)
        or p.name ilike $2 escape '\\'
        or p.sku ilike $2 escape '\\'
        or exists (select 1 from variants v where v.product_id = p.id and v.metal ilike $2 escape '\\')
        or exists (select 1 from product_tags t where t.product_id = p.id and t.tag ilike $2 escape '\\')
        or exists (
          select 1 from product_categories pc join categories c on c.id = pc.category_id
          where pc.product_id = p.id and (c.slug ilike $2 escape '\\' or c.label ilike $2 escape '\\')
        )
      )
    order by p.published_at desc, p.id desc
    limit $3
  `, [query, like, limit]);
}

export async function productBySlug(db: Db, slug: string) {
  const found = await rows(db, `
    select p.id, p.slug, p.name, p.description, p.sku, p.image_url, p.product_type, p.material,
           p.metal_family, p.gemstone, p.purity, p.certification, p.weight_g, p.published_at,
           (select b.name from brands b where b.id = p.brand_id) as brand,
           coalesce((select round(avg(r.rating)::numeric, 1) from reviews r where r.product_id = p.id and r.status = 'published'), 0) as rating,
           coalesce((select count(*) from reviews r where r.product_id = p.id and r.status = 'published'), 0) as review_count,
           (select c.label from product_categories pc join categories c on c.id = pc.category_id where pc.product_id = p.id and pc.is_primary) as category_label,
           (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active') as price,
           (select c.slug from product_categories pc join categories c on c.id = pc.category_id where pc.product_id = p.id and pc.is_primary) as category,
           coalesce((select json_agg(c.slug) from product_categories pc join categories c on c.id = pc.category_id where pc.product_id = p.id and not pc.is_primary), '[]'::json) as appears_in,
           coalesce((select json_agg(t.tag) from product_tags t where t.product_id = p.id), '[]'::json) as tags,
           coalesce((select json_agg(json_build_object('sort', d.sort, 'body', d.body) order by d.sort) from product_details d where d.product_id = p.id), '[]'::json) as details,
           coalesce((select json_agg(json_build_object('url', m.url, 'alt', m.alt, 'sort', m.sort) order by m.sort) from product_media m where m.product_id = p.id), '[]'::json) as media,
           coalesce((select json_agg(json_build_object(
             'id', v.id, 'sku', v.sku, 'metal', v.metal, 'size', v.size, 'price', v.price, 'currency', v.currency, 'available', i.available
           ) order by v.metal, v.size)
           from variants v join inventory_levels i on i.variant_id = v.id
           where v.product_id = p.id and v.status = 'active'), '[]'::json) as variants
    from products p
    where p.slug = $1 and p.status = 'active'
  `, [slug]);
  return found[0] ?? null;
}

export async function availabilityForSlug(db: Db, slug: string) {
  return rows<{ id: string; available: number }>(db, `
    select v.id, i.available
    from products p
    join variants v on v.product_id = p.id and v.status = 'active'
    join inventory_levels i on i.variant_id = v.id
    where p.slug = $1 and p.status = 'active'
  `, [slug]);
}

export async function categories(db: Db) {
  return rows(db, "select slug, label, subtitle, image_url, sort from categories order by sort, slug");
}

export async function brands(db: Db) {
  return rows(db, "select slug, name from brands order by name");
}

export async function recentReviews(db: Db, limit: number) {
  return rows(db, `
    select r.id, r.rating, r.title, r.body, r.created_at, pr.full_name, p.slug, p.name as product_name
    from reviews r
    join profiles pr on pr.id = r.customer_id
    join products p on p.id = r.product_id
    where r.status = 'published'
    order by r.created_at desc
    limit $1
  `, [limit]);
}

export async function collections(db: Db) {
  return rows(db, "select slug, title, subtitle, image_url from collections order by title");
}

export async function collectionBySlug(db: Db, slug: string) {
  const found = await rows<{ id: string; slug: string; title: string; subtitle: string; image_url: string | null }>(db, "select id, slug, title, subtitle, image_url from collections where slug = $1", [slug]);
  if (!found[0]) return null;
  const products = await rows(db, `
    select ${card}
    from collection_products cp
    join products p on p.id = cp.product_id and p.status = 'active'
    where cp.collection_id = $1
    order by cp.sort, p.published_at desc
  `, [found[0].id]);
  return { ...found[0], products };
}
