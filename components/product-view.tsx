"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { lineFrom, ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store";
import { Button, Container, Field, Quantity, Stars } from "@/components/ui";
import { sizesFor, type Product } from "@/lib/catalog";
import { ApiError } from "@/lib/api";
import { cn, pkr } from "@/lib/format";
import { fetchProductReviews, type HouseReview } from "@/lib/shop";
import { arrivalDate, formatDay } from "@/lib/shipment";

export function ProductView({ product, related, editorial }: { product: Product; related: Product[]; editorial?: string[] }) {
  const { addToCart, toggleWish, wished, city, setDeliverTo, cities, session, writeReview } = useStore();
  const [metal, setMetal] = useState(product.metals[0] ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [reviews, setReviews] = useState<HouseReview[] | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const saved = wished(product.slug);
  const metalSizes = sizesFor(product, metal);
  const variant = product.variants.find((item) => item.metal === metal && item.size === size) ?? product.defaultVariant;
  const cityInfo = cities.find((item) => item.city === city);
  const cityNames = cities.map((item) => item.city);
  const soldOut = !variant || variant.available < 1;

  useEffect(() => {
    let cancel = false;
    fetchProductReviews(product.slug).then((items) => {
      if (!cancel) setReviews(items);
    }).catch(() => {
      if (!cancel) setReviewError("Reviews could not be loaded.");
    });
    return () => {
      cancel = true;
    };
  }, [product.slug]);

  return (
    <Container className="py-8 sm:py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs tracking-[0.14em] text-mute uppercase">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <Link href={`/shop/${product.category}`} className="hover:text-gold">{product.categoryLabel || product.category}</Link>
        <span>/</span>
        <span className="text-cream">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <button type="button" onClick={() => setZoom(true)} className="relative aspect-square overflow-hidden border border-gold/25 bg-card" aria-label="Enlarge photograph">
          <Image src={product.image} alt={product.name} fill priority className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
        </button>

        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">{product.brand ? `${product.brand} · ` : ""}{product.sku}</p>
          <h1 className="mt-2 font-serif text-4xl text-cream sm:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Stars value={product.rating} />
            <span className="text-sm text-mute">{product.reviewCount} reviews</span>
          </div>
          <p className="mt-4 font-serif text-3xl text-gold-2">{pkr(variant?.price ?? product.price)}</p>
          <p className="mt-2 text-sm text-mute">{soldOut ? "Out of stock" : `${variant?.available} in stock`}</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-cream/80">{product.description}</p>
          {editorial?.map((paragraph) => <p key={paragraph} className="mt-3 max-w-xl text-sm leading-7 text-cream/80">{paragraph}</p>)}

          <Option label="Metal" value={metal} options={product.metals} onChange={(value) => { setMetal(value); const next = sizesFor(product, value); setSize(next[0] ?? ""); setQty(1); }} />
          <Option label="Size" value={size} options={metalSizes} onChange={setSize} />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Quantity value={qty} max={Math.min(8, variant?.available || 1)} onChange={setQty} />
            <Button className="flex-1" disabled={soldOut} onClick={() => {
              const picked = product.variants.find((item) => item.metal === metal && item.size === size) ?? variant;
              const line = picked ? { ...lineFrom({ ...product, defaultVariant: picked })!, qty: Math.min(qty, picked.available) } : null;
              if (line) void addToCart(line);
            }}>
              <Icon name="bag" className="h-4 w-4" /> Add to cart
            </Button>
          </div>
          <button type="button" onClick={() => toggleWish(product)} className="mt-4 inline-flex items-center gap-2 text-sm text-gold">
            <Icon name="heart" className="h-4 w-4" filled={saved} />
            {saved ? "Saved to wishlist" : "Save to wishlist"}
          </button>

          <div className="mt-8 border border-gold/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block">
                <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Deliver to</span>
                <select aria-label="Delivery city" value={city} onChange={(event) => setDeliverTo(event.target.value)} className="h-11 border border-line bg-ink px-3 text-sm text-cream outline-none focus:border-gold">
                  {cityNames.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <p className="font-serif text-2xl text-cream">
                {cityInfo ? `Arrives ${formatDay(arrivalDate(city, new Date(), false, cityInfo.transitDays).toISOString())}` : "Checking delivery"}
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

      <Reviews product={product} reviews={reviews} error={reviewError} reload={() => {
        setReviewError("");
        fetchProductReviews(product.slug).then(setReviews).catch(() => setReviewError("Reviews could not be loaded."));
      }} session={Boolean(session)} rating={rating} title={title} body={body} note={reviewNote} onRating={setRating} onTitle={setTitle} onBody={setBody} onSubmit={async (event) => {
        event.preventDefault();
        setReviewNote("");
        try {
          await writeReview(product.slug, { rating, title, body });
          setReviewNote("Received. It will show after the house publishes it.");
          setBody("");
        } catch (reason) {
          setReviewNote(reason instanceof ApiError ? reason.message : "The review could not be sent.");
        }
      }} />

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

function Reviews({
  reviews,
  error,
  reload,
  session,
  rating,
  title,
  body,
  note,
  onRating,
  onTitle,
  onBody,
  onSubmit,
}: {
  product: Product;
  reviews: HouseReview[] | null;
  error: string;
  reload: () => void;
  session: boolean;
  rating: number;
  title: string;
  body: string;
  note: string;
  onRating: (value: number) => void;
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="font-serif text-3xl tracking-[0.12em] text-cream uppercase">Reviews</h2>
      {reviews === null && !error ? <p className="mt-4 text-sm text-mute">Loading reviews</p> : null}
      {error ? (
        <div className="mt-4">
          <p className="text-sm text-blush">{error}</p>
          <Button variant="line" className="mt-3" onClick={reload}>Try again</Button>
        </div>
      ) : null}
      {reviews && reviews.length === 0 ? <p className="mt-4 text-sm text-mute">No published reviews yet.</p> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {reviews?.map((review) => (
          <figure key={review.id} className="border border-line p-4">
            <Stars value={review.rating} />
            <figcaption className="mt-2 text-sm text-cream">{review.name}</figcaption>
            {review.title ? <p className="mt-2 text-sm text-gold">{review.title}</p> : null}
            <blockquote className="mt-2 text-sm leading-6 text-mute">{review.body}</blockquote>
          </figure>
        ))}
      </div>
      {session ? (
        <form onSubmit={onSubmit} className="mt-6 grid max-w-lg gap-4">
          <label className="block">
            <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Rating</span>
            <select value={rating} onChange={(event) => onRating(Number(event.target.value))} className="h-11 border border-line bg-ink px-3 text-sm text-cream">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <Field label="Title" value={title} onChange={(event) => onTitle(event.target.value)} />
          <label className="block">
            <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Review</span>
            <textarea value={body} onChange={(event) => onBody(event.target.value)} rows={4} className="w-full border border-line bg-transparent px-3.5 py-3 text-sm text-cream outline-none focus:border-gold" />
          </label>
          {note ? <p className="text-sm text-gold">{note}</p> : null}
          <Button type="submit" className="w-fit">Send review</Button>
        </form>
      ) : <p className="mt-6 text-sm text-mute">Sign in to write a review.</p>}
    </section>
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
