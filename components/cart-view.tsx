"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/store";
import { ButtonLink, Container, EmptyState, PageHeader, Quantity } from "@/components/ui";
import { pkr } from "@/lib/format";

export function CartView() {
  const { ready, cart, setQty, removeLine, subtotal } = useStore();

  if (!ready) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading bag</Container>;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Your bag" title="Cart" subtitle="Insured delivery is free across Pakistan." />
      {cart.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Your bag is empty" text="The collection is open. A ring, a pair of drops, a chain for someone else." href="/shop" action="Shop the collection" />
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.4fr_0.7fr]">
          <ul className="divide-y divide-line border border-line">
            {cart.map((line) => (
              <li key={line.variantId} className="flex gap-4 p-4">
                <Link href={`/product/${line.slug}`} className="relative h-24 w-24 shrink-0 bg-card sm:h-28 sm:w-28">
                  {line.image ? <Image src={line.image} alt={line.name} fill className="object-cover" sizes="112px" /> : null}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/product/${line.slug}`} className="font-serif text-xl text-cream hover:text-gold">{line.name}</Link>
                      <p className="mt-1 text-xs tracking-[0.12em] text-mute uppercase">{line.metal} · Size {line.size}</p>
                      {line.available < line.qty ? <p className="mt-1 text-xs text-blush">Only {line.available} left</p> : null}
                    </div>
                    <p className="text-sm text-gold-2">{pkr(line.price * line.qty)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Quantity value={line.qty} max={Math.min(8, Math.max(line.qty, line.available))} onChange={(qty) => setQty(line.variantId, qty)} />
                    <button type="button" onClick={() => removeLine(line.variantId)} className="text-xs tracking-[0.14em] text-mute uppercase hover:text-gold">Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="border border-gold/30 bg-panel p-5 sm:p-6 lg:sticky lg:top-28">
            <h2 className="font-serif text-2xl text-cream">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-mute"><dt>Subtotal</dt><dd>{pkr(subtotal)}</dd></div>
              <div className="flex justify-between text-mute"><dt>Delivery</dt><dd>Calculated at checkout</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base text-cream"><dt>Total</dt><dd>{pkr(subtotal)}</dd></div>
            </dl>
            <ButtonLink href="/checkout" className="mt-6 w-full">Checkout</ButtonLink>
            <p className="mt-3 text-center text-xs text-mute">Cash on delivery, bank transfer, or card.</p>
          </aside>
        </div>
      )}
    </Container>
  );
}
