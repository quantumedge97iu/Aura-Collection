"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useStore } from "@/components/store";
import type { Product } from "@/lib/catalog";
import { pkr } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWish, wished } = useStore();
  const saved = wished(product.slug);

  return (
    <article className="group flex h-full flex-col border border-gold/25 bg-card">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width:1280px) 22vw, (min-width:768px) 33vw, 50vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>
        <button
          type="button"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          onClick={() => toggleWish(product.slug)}
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
          onClick={() => addToCart({ slug: product.slug, qty: 1, metal: product.metals[0], size: product.sizes[0] })}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-gold/60 px-2 py-2.5 text-[10px] tracking-[0.14em] text-gold uppercase transition hover:bg-gold hover:text-ink sm:text-[11px]"
        >
          <Icon name="bag" className="h-3.5 w-3.5" />
          Add to cart
        </button>
      </div>
    </article>
  );
}
