"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Button, Container, EmptyState, PageHeader, ProductGridSkeleton, fieldClass } from "@/components/ui";
import { ApiError } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { cn } from "@/lib/format";
import { fetchProducts, type ListQuery } from "@/lib/shop";

const bands = [
  { id: "all", label: "All prices", min: undefined, max: undefined },
  { id: "30", label: "Under 30,000", min: undefined, max: 29999 },
  { id: "60", label: "30,000 – 60,000", min: 30000, max: 60000 },
  { id: "100", label: "60,000 – 100,000", min: 60001, max: 100000 },
  { id: "above", label: "Over 100,000", min: 100001, max: undefined },
];

export function CatalogView({
  eyebrow,
  title,
  subtitle,
  products,
  nextCursor,
  metals,
  query,
  mode = "api",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  products: Product[];
  nextCursor: string | null;
  metals: string[];
  query: ListQuery;
  mode?: "api" | "local";
}) {
  const [sort, setSort] = useState("featured");
  const [metal, setMetal] = useState("all");
  const [band, setBand] = useState("all");
  const [items, setItems] = useState(products);
  const [cursor, setCursor] = useState(nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(next: { metal?: string; band?: string; sort?: string; cursor?: string; append?: boolean }) {
    const metalValue = next.metal ?? metal;
    const bandValue = next.band ?? band;
    const sortValue = next.sort ?? sort;
    const price = bands.find((item) => item.id === bandValue) ?? bands[0];
    setLoading(true);
    setError("");
    try {
      const page = await fetchProducts({
        ...query,
        metal: metalValue === "all" ? undefined : metalValue,
        minPrice: price.min,
        maxPrice: price.max,
        sort: sortValue,
        cursor: next.cursor,
        limit: next.cursor ? 12 : 48,
      });
      setItems((current) => (next.append ? [...current, ...page.products] : page.products));
      setCursor(page.nextCursor);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "The collection could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function visibleFor(metalValue: string, bandValue: string, sortValue: string) {
    const price = bands.find((item) => item.id === bandValue) ?? bands[0];
    const next = products.filter((product) => {
      const metalOk = metalValue === "all" || product.metals.includes(metalValue);
      const priceOk = (price.min == null || product.price >= price.min) && (price.max == null || product.price <= price.max);
      return metalOk && priceOk;
    });
    if (sortValue === "price-asc") next.sort((a, b) => a.price - b.price);
    if (sortValue === "price-desc") next.sort((a, b) => b.price - a.price);
    if (sortValue === "rating") next.sort((a, b) => b.rating - a.rating);
    return next;
  }

  function chooseMetal(value: string) {
    setMetal(value);
    if (mode === "local") {
      setItems(visibleFor(value, band, sort));
      return;
    }
    void load({ metal: value });
  }

  function chooseBand(value: string) {
    setBand(value);
    if (mode === "local") {
      setItems(visibleFor(metal, value, sort));
      return;
    }
    void load({ band: value });
  }

  function chooseSort(value: string) {
    setSort(value);
    if (mode === "local") {
      setItems(visibleFor(metal, band, value));
      return;
    }
    void load({ sort: value });
  }

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-8 flex flex-col gap-4 border border-line p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={metal === "all"} onClick={() => chooseMetal("all")}>All metals</FilterChip>
          {metals.map((item) => (
            <FilterChip key={item} active={metal === item} onClick={() => chooseMetal(item)}>{item}</FilterChip>
          ))}
        </div>
        <label className="flex items-center gap-3 text-[11px] tracking-[0.16em] text-mute uppercase">
          Sort
          <select value={sort} onChange={(event) => chooseSort(event.target.value)} className={cn(fieldClass, "w-auto bg-ink py-2")}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bands.map((item) => (
          <FilterChip key={item.id} active={band === item.id} onClick={() => chooseBand(item.id)}>{item.label}</FilterChip>
        ))}
      </div>
      <p className="mt-5 text-sm text-mute">{items.length} {items.length === 1 ? "piece" : "pieces"}</p>
      {error ? (
        <div className="mt-6 border border-line px-6 py-10 text-center">
          <p className="text-sm text-blush">{error}</p>
          <Button className="mt-4" onClick={() => load({})}>Try again</Button>
        </div>
      ) : null}
      {loading ? <ProductGridSkeleton /> : null}
      {!loading && items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing in this cut" text="Clear a filter, or look through the full house collection." href="/shop" action="Shop all" />
        </div>
      ) : null}
      {!loading && items.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">
          {items.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : null}
      {cursor && !loading ? (
        <div className="mt-8 flex justify-center">
          <Button variant="line" onClick={() => load({ cursor, append: true })}>Load more</Button>
        </div>
      ) : null}
    </Container>
  );
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("border px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase", active ? "border-gold bg-gold text-ink" : "border-line text-cream hover:border-gold")}>
      {children}
    </button>
  );
}
