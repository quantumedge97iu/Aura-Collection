"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShipmentTrack } from "@/components/shipment-track";
import { paymentLabel, useClientReady, useStore, type Order } from "@/components/store";
import { Button, Container, EmptyState, PageHeader, fieldClass } from "@/components/ui";
import { pkr } from "@/lib/format";
import { formatDay, shipmentOf, trackingCode } from "@/lib/shipment";

export function OrderView({ id }: { id: string }) {
  const { orders } = useStore();
  const ready = useClientReady();
  const order = orders.find((item) => item.id.toLowerCase() === id.toLowerCase());

  if (!ready) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading order</Container>;
  if (!order) {
    return (
      <Container className="py-10 sm:py-14">
        <EmptyState title="Order not on this device" text="Confirmations are saved in this browser. Check the number, or place an order from the bag." href="/track" action="Track an order" />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Confirmation" title={order.id} subtitle={`${trackingCode(order.id)} · placed ${new Date(order.createdAt).toLocaleString("en-PK")}`} />
      <div className="mt-8">
        <ShipmentTrack order={order} />
      </div>
      <OrderBody order={order} />
    </Container>
  );
}

export function TrackView() {
  const { orders } = useStore();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Order | null | undefined>(undefined);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const needle = query.trim().toLowerCase();
    const match = orders.find((order) => order.id.toLowerCase() === needle || trackingCode(order.id).toLowerCase() === needle);
    setFound(match ?? null);
  }

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Support" title="Track shipment" subtitle="Use the order number or the LX tracking number from your confirmation. This looks on this device." />
      <form onSubmit={submit} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="LJ-10428 or LX-10428" aria-label="Order or tracking number" className={fieldClass} />
        <Button type="submit">Track</Button>
      </form>
      {found === null ? <p className="mt-6 text-sm text-blush">No order with that number is saved in this browser.</p> : null}
      {found ? (
        <div className="mt-8 space-y-6">
          <ShipmentTrack order={found} />
          <OrderBody order={found} />
        </div>
      ) : null}
      {orders.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-[11px] tracking-[0.18em] text-mute uppercase">On this device</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {orders.map((order) => {
              const shipment = shipmentOf(order);
              return (
                <li key={order.id}>
                  <Link href={`/order/${order.id}`} className="block border border-line p-4 hover:border-gold">
                    <span className="font-serif text-2xl text-cream">{order.id}</span>
                    <span className="mt-1 block text-sm text-gold">{shipment.steps[shipment.current].label}</span>
                    <span className="mt-1 block text-sm text-mute">{shipment.tracking} · {order.shipping.city} · {formatDay(shipment.eta)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </Container>
  );
}

function OrderBody({ order }: { order: Order }) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="border border-line p-5">
        <h2 className="font-serif text-2xl text-cream">Pieces</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((item) => (
            <li key={`${item.slug}-${item.metal}-${item.size}`} className="flex gap-3 py-3">
              <div className="relative h-16 w-16 shrink-0 bg-card">
                <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-cream">{item.name}</p>
                <p className="text-xs text-mute">{item.metal} · {item.size} · Qty {item.qty}</p>
              </div>
              <p className="text-sm text-gold-2">{pkr(item.price * item.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-mute"><dt>Delivery</dt><dd>Free</dd></div>
          <div className="flex justify-between text-cream"><dt>Total</dt><dd>{pkr(order.total)}</dd></div>
        </dl>
      </section>
      <section className="border border-line p-5">
        <h2 className="font-serif text-2xl text-cream">Delivery</h2>
        <p className="mt-4 text-sm leading-7 text-mute">
          {order.shipping.name}<br />
          {order.shipping.address}<br />
          {order.shipping.city}<br />
          {order.shipping.phone}<br />
          {order.shipping.email}
        </p>
        {order.shipping.notes ? <p className="mt-3 text-sm text-mute">Note: {order.shipping.notes}</p> : null}
        <h2 className="mt-6 font-serif text-2xl text-cream">Payment</h2>
        <p className="mt-3 text-sm text-mute">
          {paymentLabel(order.payment)}
          {order.cardLast4 ? ` · ending ${order.cardLast4}` : ""}
        </p>
        <p className="mt-3 text-xs text-mute">No charge was made. This confirmation lives on this device until the payments backend is connected.</p>
      </section>
    </div>
  );
}
