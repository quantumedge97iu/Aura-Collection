import { api } from "@/lib/api";
import type { Category, CityOption, Collection, Product, Variant } from "@/lib/catalog";

type ApiVariant = {
  id: string;
  sku: string;
  metal: string;
  size: string;
  price: number;
  available: number | null;
};

type ApiCard = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string | null;
  categoryLabel?: string | null;
  brand?: string | null;
  tags?: string[];
  metals?: string[];
  rating?: number;
  reviewCount?: number;
  defaultVariant?: ApiVariant | null;
  description?: string;
  sku?: string;
  appearsIn?: string[];
  details?: Array<{ body: string } | string>;
  variants?: ApiVariant[];
};

export type ListQuery = {
  category?: string;
  tag?: string;
  metal?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  cursor?: string;
};

export type ListResult = {
  products: Product[];
  nextCursor: string | null;
  metals: string[];
};

function variantOf(row: ApiVariant | null | undefined): Variant | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    sku: row.sku,
    metal: row.metal,
    size: row.size,
    price: Number(row.price),
    available: Number(row.available ?? 0),
  };
}

export function toProduct(row: ApiCard): Product {
  const variants = (row.variants ?? []).map((item) => variantOf(item)).filter((item): item is Variant => Boolean(item));
  const fallback = variantOf(row.defaultVariant);
  const chosen = variants.length > 0 ? variants : fallback ? [fallback] : [];
  const metals = row.metals?.length ? row.metals : Array.from(new Set(chosen.map((item) => item.metal)));
  const sizes = Array.from(new Set(chosen.map((item) => item.size)));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    category: row.category ?? "",
    categoryLabel: row.categoryLabel || row.category || "",
    appearsIn: row.appearsIn ?? [],
    image: row.imageUrl ?? "",
    brand: row.brand ?? "",
    tags: row.tags ?? [],
    metals,
    sizes,
    sku: row.sku || fallback?.sku || "",
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.reviewCount ?? 0),
    description: row.description ?? "",
    details: (row.details ?? []).map((detail) => (typeof detail === "string" ? detail : detail.body)),
    defaultVariant: fallback ?? chosen[0] ?? null,
    variants: chosen,
  };
}

function queryString(input: ListQuery) {
  const params = new URLSearchParams();
  if (input.category) params.set("category", input.category);
  if (input.tag) params.set("tag", input.tag);
  if (input.metal) params.set("metal", input.metal);
  if (input.minPrice != null) params.set("minPrice", String(input.minPrice));
  if (input.maxPrice != null) params.set("maxPrice", String(input.maxPrice));
  if (input.sort) params.set("sort", input.sort);
  if (input.cursor) params.set("cursor", input.cursor);
  params.set("limit", String(input.limit ?? 12));
  return params.toString();
}

export async function fetchProducts(input: ListQuery = {}): Promise<ListResult> {
  const data = await api<{ items: ApiCard[]; nextCursor: string | null; metals?: string[] }>(`/v1/products?${queryString(input)}`);
  return { products: data.items.map(toProduct), nextCursor: data.nextCursor, metals: data.metals ?? [] };
}

export async function fetchProduct(slug: string) {
  const row = await api<ApiCard>(`/v1/products/${encodeURIComponent(slug)}`);
  return toProduct(row);
}

export async function fetchSearch(q: string) {
  const data = await api<{ items: ApiCard[] }>(`/v1/search?q=${encodeURIComponent(q)}&limit=24`);
  return data.items.map(toProduct);
}

export async function fetchCategories(): Promise<Category[]> {
  const rows = await api<Array<{ slug: string; label: string; subtitle: string; imageUrl: string | null }>>("/v1/categories");
  return rows.map((row) => ({ slug: row.slug, label: row.label, subtitle: row.subtitle, image: row.imageUrl ?? "" }));
}

export async function fetchCollections(): Promise<Collection[]> {
  const rows = await api<Array<{ slug: string; title: string; subtitle: string; imageUrl: string | null }>>("/v1/collections");
  return rows.map((row) => ({ slug: row.slug, title: row.title, subtitle: row.subtitle, image: row.imageUrl ?? "" }));
}

export async function fetchCollection(slug: string) {
  const row = await api<{ slug: string; title: string; subtitle: string; imageUrl: string | null; products: ApiCard[] }>(`/v1/collections/${encodeURIComponent(slug)}`);
  return { slug: row.slug, title: row.title, subtitle: row.subtitle, image: row.imageUrl ?? "", products: row.products.map(toProduct) };
}

export async function fetchCities(): Promise<CityOption[]> {
  const data = await api<{ items: CityOption[] }>("/v1/shipping/cities");
  return data.items;
}

export async function fetchBrands() {
  return api<Array<{ slug: string; name: string }>>("/v1/brands");
}

export type HouseReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  name: string;
  slug?: string;
  productName?: string;
  createdAt?: string;
};

export async function fetchHouseReviews() {
  const data = await api<{ items: HouseReview[] }>("/v1/reviews?limit=12");
  return data.items;
}

export async function fetchProductReviews(slug: string) {
  const data = await api<{ items: HouseReview[] }>(`/v1/products/${encodeURIComponent(slug)}/reviews`);
  return data.items;
}

export async function loadNav() {
  try {
    const [categories, collections, cities] = await Promise.all([fetchCategories(), fetchCollections(), fetchCities()]);
    return { categories, collections, cities };
  } catch {
    return { categories: [] as Category[], collections: [] as Collection[], cities: [] as CityOption[] };
  }
}
