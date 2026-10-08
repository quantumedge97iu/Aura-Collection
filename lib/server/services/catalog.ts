import type pg from "pg";
import type { Kv } from "../cache/kv";
import { catalogCacheKey, type Actor } from "../domain";
import { withActor } from "../db";
import * as catalog from "../repositories/catalog";

const ttlMs = 60_000;

function like(value: string) {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function card(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    imageUrl: row.image_url,
    category: row.category,
    brand: row.brand,
    tags: asList(row.tags),
    metals: asList(row.metals),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    defaultVariant: variant(row.default_variant),
    publishedAt: row.published_at,
  };
}

function asList(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return JSON.parse(value) as unknown[];
  return [];
}

function variant(value: unknown) {
  const row = typeof value === "string" ? JSON.parse(value) as Record<string, unknown> | null : value as Record<string, unknown> | null;
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    metal: row.metal,
    size: row.size,
    price: Number(row.price),
    available: Number(row.available),
  };
}

export function createCatalogService(pool: pg.Pool, cache: Kv) {
  async function cached<T>(actor: Actor, name: string, query: unknown, load: (db: Parameters<Parameters<typeof withActor>[2]>[0]) => Promise<T>) {
    const version = await withActor(pool, actor, catalog.catalogVersion);
    const key = catalogCacheKey(version, name, query);
    const hit = await cache.get(key);
    if (hit) return JSON.parse(hit) as T;
    const value = await withActor(pool, actor, load);
    await cache.set(key, JSON.stringify(value), ttlMs);
    return value;
  }

  return {
    async list(actor: Actor, query: { category: string | null; tag: string | null; metal: string | null; limit: number; cursor: string | null; minPrice: number | null; maxPrice: number | null; sort: string | null }) {
      const featured = !query.sort || query.sort === "featured";
      const [cursorAt, cursorId] = featured && query.cursor ? query.cursor.split("|") : [null, null];
      const limit = query.limit;
      const input = { ...query, cursorAt, cursorId, minPrice: query.minPrice, maxPrice: query.maxPrice, sort: featured ? null : query.sort };
      const rows = await cached(actor, "list", input, (db) => catalog.listProducts(db, input));
      const metals = await cached(actor, "metals", { category: query.category, tag: query.tag }, (db) => catalog.listingMetals(db, query.category, query.tag)) as string[];
      const items = (rows as Record<string, unknown>[]).map(card);
      const last = items.at(-1);
      const nextCursor = featured && query.minPrice == null && query.maxPrice == null && items.length === limit && last
        ? `${new Date(last.publishedAt as string).toISOString()}|${last.id}`
        : null;
      return { items, nextCursor, metals };
    },
    async search(actor: Actor, query: string, limit: number) {
      const items = (await cached(actor, "search", { query, limit }, (db) => catalog.searchProducts(db, query, like(query), limit)) as Record<string, unknown>[]).map(card);
      return { items };
    },
    async detail(actor: Actor, slug: string) {
      const version = await withActor(pool, actor, catalog.catalogVersion);
      const key = catalogCacheKey(version, "product", { slug });
      const hit = await cache.get(key);
      let product = hit ? JSON.parse(hit) as ReturnType<typeof mapDetail> : null;
      if (!product) {
        const live = await withActor(pool, actor, (db) => catalog.productBySlug(db, slug));
        if (!live) return null;
        product = mapDetail(live as Record<string, unknown>);
        const cacheable = { ...product, variants: product.variants.map((variant) => ({ ...variant, available: null })) };
        await cache.set(key, JSON.stringify(cacheable), ttlMs);
      }
      const stock = await withActor(pool, actor, (db) => catalog.availabilityForSlug(db, slug));
      const available = new Map(stock.map((row) => [row.id, Number(row.available)]));
      return { ...product, variants: product.variants.map((variant) => ({ ...variant, available: available.get(String(variant.id)) ?? 0 })) };
    },
    async categories(actor: Actor) {
      const list = await cached(actor, "categories", {}, catalog.categories) as Record<string, unknown>[];
      return list.map((row) => ({ slug: row.slug, label: row.label, subtitle: row.subtitle, imageUrl: row.image_url, sort: row.sort }));
    },
    async brands(actor: Actor) {
      const list = await cached(actor, "brands", {}, catalog.brands) as Record<string, unknown>[];
      return list.map((row) => ({ slug: row.slug, name: row.name }));
    },
    async recentReviews(actor: Actor, limit: number) {
      const list = await withActor(pool, actor, (db) => catalog.recentReviews(db, limit));
      return list.map((row) => ({
        id: row.id,
        rating: Number(row.rating),
        title: row.title,
        body: row.body,
        createdAt: row.created_at,
        name: row.full_name,
        slug: row.slug,
        productName: row.product_name,
      }));
    },
    async collections(actor: Actor) {
      const list = await cached(actor, "collections", {}, catalog.collections) as Record<string, unknown>[];
      return list.map((row) => ({ slug: row.slug, title: row.title, subtitle: row.subtitle, imageUrl: row.image_url }));
    },
    async collection(actor: Actor, slug: string) {
      const found = await cached(actor, "collection", { slug }, (db) => catalog.collectionBySlug(db, slug)) as { slug: string; title: string; subtitle: string; image_url: string | null; products: Record<string, unknown>[] } | null;
      if (!found) return null;
      return { slug: found.slug, title: found.title, subtitle: found.subtitle, imageUrl: found.image_url, products: found.products.map(card) };
    },
  };
}

function mapDetail(row: Record<string, unknown>) {
  const variants = (row.variants as Record<string, unknown>[]).map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    metal: variant.metal,
    size: variant.size,
    price: Number(variant.price),
    currency: variant.currency,
    available: Number(variant.available),
  }));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sku: row.sku,
    price: Number(row.price),
    imageUrl: row.image_url,
    brand: row.brand,
    categoryLabel: row.category_label,
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    productType: row.product_type,
    material: row.material,
    metalFamily: row.metal_family,
    gemstone: row.gemstone,
    purity: row.purity,
    certification: row.certification,
    weightG: row.weight_g == null ? null : Number(row.weight_g),
    category: row.category,
    appearsIn: row.appears_in,
    tags: row.tags,
    details: row.details,
    media: row.media,
    variants,
    publishedAt: row.published_at,
  };
}
