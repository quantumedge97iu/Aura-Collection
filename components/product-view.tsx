"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { useClientReady, useStore } from "@/components/store";
import { Button, Container, Quantity, Stars } from "@/components/ui";
import { categoryLabel, type Product } from "@/lib/catalog";
import { cities } from "@/lib/content";
import { cn, pkr } from "@/lib/format";
import { arrivalDate, formatDay } from "@/lib/shipment";

export function ProductView({ product, related }: { product: Product; related: Product[] }) {
  const { addToCart, toggleWish, wished, city, setDeliverTo } = useStore();
  const ready = useClientReady();
  const [metal, setMetal] = useState(product.metals[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const saved = wished(product.slug);

  return (
    <Container className="py-8 sm:py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs tracking-[0.14em] text-mute uppercase">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <Link href={`/shop/${product.category}`} className="hover:text-gold">{categoryLabel(product.category)}</Link>
        <span>/</span>
        <span className="text-cream">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <button type="button" onClick={() => setZoom(true)} className="relative aspect-square overflow-hidden border border-gold/25 bg-card" aria-label="Enlarge photograph">
          <Image src={product.image} alt={product.name} fill priority className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
        </button>

        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">{product.sku}</p>
          <h1 className="mt-2 font-serif text-4xl text-cream sm:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Stars value={product.rating} />
            <span className="text-sm text-mute">{product.reviewCount} reviews</span>
          </div>
          <p className="mt-4 font-serif text-3xl text-gold-2">{pkr(product.price)}</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-cream/80">{product.description}</p>

          <Option label="Metal" value={metal} options={product.metals} onChange={setMetal} />
          <Option label="Size" value={size} options={product.sizes} onChange={setSize} />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Quantity value={qty} onChange={setQty} />
            <Button className="flex-1" onClick={() => addToCart({ slug: product.slug, qty, metal, size })}>
              <Icon name="bag" className="h-4 w-4" /> Add to cart
            </Button>
          </div>
          <button type="button" onClick={() => toggleWish(product.slug)} className="mt-4 inline-flex items-center gap-2 text-sm text-gold">
            <Icon name="heart" className="h-4 w-4" filled={saved} />
            {saved ? "Saved to wishlist" : "Save to wishlist"}
          </button>

          <div className="mt-8 border border-gold/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block">
                <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Deliver to</span>
                <select aria-label="Delivery city" value={city} onChange={(event) => setDeliverTo(event.target.value)} className="h-11 border border-line bg-ink px-3 text-sm text-cream outline-none focus:border-gold">
                  {cities.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <p className="font-serif text-2xl text-cream">
                {ready ? `Arrives ${formatDay(arrivalDate(city, new Date(), product.category === "bridal").toISOString())}` : "Checking delivery"}
              </p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {["Free delivery", "Cash on delivery", "Hallmarked gold", "7-day returns"].map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm text-mute">
                  <Icon name="check" className="h-4 w-4 text-gold" /> {item}
                </p>
              ))}
            </div>
          </div>

          <details className="mt-6 border-t border-line py-4" open>
            <summary className="cursor-pointer text-[11px] tracking-[0.18em] text-cream uppercase">Details</summary>
            <ul className="mt-3 space-y-2 text-sm text-mute">
              {product.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </details>
          <p className="text-sm text-mute">
            Unsure of the fit? Read the <Link href="/policies/size-guide" className="text-gold">size guide</Link>.
          </p>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-serif text-3xl tracking-[0.12em] text-cream uppercase">You may also like</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>

      {zoom ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-4" onClick={() => setZoom(false)}>
          <button type="button" aria-label="Close photograph" className="absolute top-4 right-4 text-gold"><Icon name="close" className="h-6 w-6" /></button>
          <div className="relative h-[min(80vh,820px)] w-full max-w-3xl">
            <Image src={product.image} alt={product.name} fill className="object-contain" sizes="90vw" />
          </div>
        </div>
      ) : null}
    </Container>
  );
}

function Option({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="mt-6">
      <p className="text-[11px] tracking-[0.16em] text-mute uppercase">{label}: <span className="text-cream">{value}</span></p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={cn("border px-3 py-2 text-sm", option === value ? "border-gold text-gold" : "border-line text-cream hover:border-gold")}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
