import type { Db } from "../db";
import { rows } from "../db";

function pageOf(fromWhere: string, order: string, pageOrder: string, limit: string, extra = "") {
  return `
    with page as materialized (
      select ${extra} c.product_id as id, c.slug, c.name, c.image_url, c.published_at,
             c.brand_name as brand, c.min_price as price, c.category_slug as category,
             to_json(c.tags) as tags, to_json(c.metals) as metals,
             c.rating, c.review_count, c.default_variant
      from ${fromWhere}
      order by ${order}
      ${limit}
    )
    select page.id, page.slug, page.name, page.image_url, page.published_at, page.brand, page.price,
           page.category, page.tags, page.metals, page.rating, page.review_count,
           case when page.default_variant is null then null
                else page.default_variant || jsonb_build_object('available', coalesce(i.available, 0))
           end as default_variant
    from page
    left join inventory_levels i on i.variant_id = (page.default_variant->>'id')::uuid
    order by ${pageOrder}
  `;
}

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
  const ranked = input.sort === "price-asc"
    ? ["c.min_price asc nulls last, c.published_at desc, c.product_id desc", "page.price asc nulls last, page.published_at desc, page.id desc"]
    : input.sort === "price-desc"
      ? ["c.min_price desc nulls last, c.published_at desc, c.product_id desc", "page.price desc nulls last, page.published_at desc, page.id desc"]
      : input.sort === "rating"
        ? ["c.rating desc, c.published_at desc, c.product_id desc", "page.rating desc, page.published_at desc, page.id desc"]
        : ["c.published_at desc, c.product_id desc", "page.published_at desc, page.id desc"];
  return rows(db, pageOf(`
    product_cards c
    where c.status = 'active'
      and ($1::text is null or c.category_slug = $1)
      and ($2::text is null or c.tags @> array[$2]::text[])
      and ($3::text is null or c.metals @> array[$3]::text[])
      and ($4::timestamptz is null or (c.published_at, c.product_id) < ($4::timestamptz, $5::uuid))
      and ($7::int is null or c.min_price >= $7)
      and ($8::int is null or c.min_price <= $8)
  `, ranked[0], ranked[1], "limit $6"), [input.category, input.tag, input.metal, input.cursorAt, input.cursorId, input.limit, input.minPrice, input.maxPrice]);
}

export async function listingMetals(db: Db, category: string | null, tag: string | null) {
  const found = await rows<{ metal: string }>(db, `
    select distinct metal
    from product_cards c
    cross join lateral unnest(c.metals) as metal
    where c.status = 'active'
      and ($1::text is null or c.category_slug = $1)
      and ($2::text is null or c.tags @> array[$2]::text[])
    order by metal
  `, [category, tag]);
  return found.map((row) => row.metal);
}

export async function searchProducts(db: Db, query: string, like: string, limit: number) {
  return rows(db, pageOf(`
    product_cards c
    join products p on p.id = c.product_id
    where c.status = 'active'
      and (
        p.search_vector @@ plainto_tsquery('simple', $1)
        or p.name ilike $2 escape '\\'
        or p.sku ilike $2 escape '\\'
        or c.metals::text ilike $2 escape '\\'
        or c.tags::text ilike $2 escape '\\'
        or c.category_slug ilike $2 escape '\\'
      )
  `, "c.published_at desc, c.product_id desc", "page.published_at desc, page.id desc", "limit $3"), [query, like, limit]);
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
  const products = await rows(db, pageOf(`
    collection_products cp
    join product_cards c on c.product_id = cp.product_id and c.status = 'active'
    where cp.collection_id = $1
  `, "cp.sort, c.published_at desc, c.product_id desc", "page.sort, page.published_at desc, page.id desc", "", "cp.sort,"), [found[0].id]);
  return { ...found[0], products };
}
