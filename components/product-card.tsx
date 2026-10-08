"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useStore, type CartLine } from "@/components/store";
import type { Product } from "@/lib/catalog";
import { pkr } from "@/lib/format";

export function lineFrom(product: Product, qty = 1): CartLine | null {
  const variant = product.defaultVariant;
  if (!variant) return null;
  return {
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    image: product.image,
    price: variant.price,
    metal: variant.metal,
    size: variant.size,
    qty,
    available: variant.available,
  };
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWish, wished } = useStore();
  const saved = wished(product.slug);
  const line = lineFrom(product);
  const soldOut = !line || line.available < 1;

  return (
    <article className="group flex h-full flex-col border border-gold/25 bg-card">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width:1280px) 22vw, (min-width:768px) 33vw, 50vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          ) : null}
        </Link>
        <button
          type="button"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          onClick={() => toggleWish(product)}
          className="absolute top-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full border border-gold/30 bg-ink/70 text-gold"
        >
          <Icon name="heart" className="h-4 w-4" filled={saved} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/product/${product.slug}`} className="font-serif text-lg leading-tight text-cream hover:text-gold sm:text-xl">
          {product.name}
        </Link>
        <p className="mt-1.5 text-sm text-gold-2">{pkr(product.price)}</p>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => line && addToCart(line)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-gold/60 px-2 py-2.5 text-[10px] tracking-[0.14em] text-gold uppercase transition hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px]"
        >
          <Icon name="bag" className="h-3.5 w-3.5" />
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
