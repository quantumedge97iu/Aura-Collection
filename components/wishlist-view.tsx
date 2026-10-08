"use client";

import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store";
import { Container, EmptyState, PageHeader } from "@/components/ui";

export function WishlistView() {
  const { ready, wishlist, session } = useStore();

  if (!ready) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading wishlist</Container>;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Saved" title="Wishlist" subtitle={session ? "Pieces saved to your account." : "Sign in to keep pieces on your account."} />
      {wishlist.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nothing saved yet" text="Tap the heart on a piece to keep it here." href="/shop" action="Browse jewelry" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">
          {wishlist.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
