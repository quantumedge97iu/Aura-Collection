"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Container, EmptyState, PageHeader, fieldClass } from "@/components/ui";
import type { Product } from "@/lib/catalog";
import { cn } from "@/lib/format";

const bands = [
  { id: "all", label: "All prices" },
  { id: "30", label: "Under 30,000" },
  { id: "60", label: "30,000 – 60,000" },
  { id: "100", label: "60,000 – 100,000" },
  { id: "above", label: "Over 100,000" },
];

function inBand(price: number, band: string) {
  if (band === "30") return price < 30000;
  if (band === "60") return price >= 30000 && price <= 60000;
  if (band === "100") return price > 60000 && price <= 100000;
  if (band === "above") return price > 100000;
  return true;
}

export function CatalogView({ eyebrow, title, subtitle, products }: { eyebrow: string; title: string; subtitle: string; products: Product[] }) {
  const [sort, setSort] = useState("featured");
  const [metal, setMetal] = useState("all");
  const [band, setBand] = useState("all");
  const metals = useMemo(() => Array.from(new Set(products.flatMap((product) => product.metals))), [products]);

  const visible = useMemo(() => {
    const filtered = products.filter((product) => (metal === "all" || product.metals.includes(metal)) && inBand(product.price, band));
    const next = filtered.slice();
    if (sort === "price-asc") next.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") next.sort((a, b) => b.price - a.price);
    if (sort === "rating") next.sort((a, b) => b.rating - a.rating);
    return next;
  }, [products, sort, metal, band]);

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-8 flex flex-col gap-4 border border-line p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={metal === "all"} onClick={() => setMetal("all")}>All metals</FilterChip>
          {metals.map((item) => (
            <FilterChip key={item} active={metal === item} onClick={() => setMetal(item)}>{item}</FilterChip>
          ))}
        </div>
        <label className="flex items-center gap-3 text-[11px] tracking-[0.16em] text-mute uppercase">
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)} className={cn(fieldClass, "w-auto bg-ink py-2")}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bands.map((item) => (
          <FilterChip key={item.id} active={band === item.id} onClick={() => setBand(item.id)}>{item.label}</FilterChip>
        ))}
      </div>
      <p className="mt-5 text-sm text-mute">{visible.length} {visible.length === 1 ? "piece" : "pieces"}</p>
      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing in this cut" text="Clear a filter, or look through the full house collection." href="/shop" action="Shop all" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">
          {visible.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
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
