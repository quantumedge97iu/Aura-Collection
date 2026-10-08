"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShipmentTrack } from "@/components/shipment-track";
import { paymentLabel, paymentStatusLabel, useStore, type Order } from "@/components/store";
import { Button, Container, EmptyState, Field, PageHeader, fieldClass } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { pkr } from "@/lib/format";
import { formatDay, shipmentOf } from "@/lib/shipment";

export function OrderView({ id }: { id: string }) {
  const { ready, loadOrder, session, cancelOrder } = useStore();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    loadOrder(decodeURIComponent(id)).then((found) => {
      if (!cancel) setOrder(found);
    }).catch((reason: unknown) => {
      if (!cancel) setError(reason instanceof ApiError ? reason.message : "The order could not be loaded.");
    });
    return () => {
      cancel = true;
    };
  }, [id, loadOrder, ready]);

  if (!ready || order === undefined) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading order</Container>;
  if (!order) {
    return (
      <Container className="py-10 sm:py-14">
        <EmptyState title="Order not found" text={error || "Check the number, or track it with the email used at checkout."} href="/track" action="Track an order" />
      </Container>
    );
  }

  const canCancel = Boolean(session) && ["created", "confirmed"].includes(order.status) && ["pending", "failed"].includes(order.paymentStatus);

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Confirmation" title={order.number} subtitle={`${order.tracking || "Tracking pending"} · placed ${new Date(order.createdAt).toLocaleString("en-PK")}`} />
      <div className="mt-8">
        <ShipmentTrack order={order} />
      </div>
      <OrderBody order={order} />
      {canCancel ? (
        <Button
          variant="line"
          className="mt-6"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            cancelOrder(order).then(( ) => loadOrder(order.number).then((next) => setOrder(next))).catch((reason: unknown) => {
              setError(reason instanceof ApiError ? reason.message : "This order could not be cancelled.");
            }).finally(() => setBusy(false));
          }}
        >
          {busy ? "Cancelling" : "Cancel order"}
        </Button>
      ) : null}
      {error ? <p className="mt-4 text-sm text-blush">{error}</p> : null}
    </Container>
  );
}

export function TrackView() {
  const { orders, lookupOrder } = useStore();
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    lookupOrder(number.trim(), email.trim()).then((order) => {
      setFound(order);
      if (!order) setError("No order matches that number and email.");
    }).catch((reason: unknown) => {
      setFound(null);
      setError(reason instanceof ApiError ? reason.message : "Tracking is unavailable right now.");
    }).finally(() => setBusy(false));
  }

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Support" title="Track shipment" subtitle="Use the order number and the email from checkout." />
      <form onSubmit={submit} className="mt-8 grid max-w-xl gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Order number</span>
          <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="LJ-10000" aria-label="Order number" className={fieldClass} />
        </label>
        <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button type="submit" disabled={busy}>{busy ? "Looking" : "Track"}</Button>
      </form>
      {error ? <p className="mt-6 text-sm text-blush">{error}</p> : null}
      {found ? (
        <div className="mt-8 space-y-6">
          <ShipmentTrack order={found} />
          <OrderBody order={found} />
        </div>
      ) : null}
      {orders.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-[11px] tracking-[0.18em] text-mute uppercase">Your orders</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {orders.map((order) => {
              const shipment = shipmentOf(order);
              return (
                <li key={order.id}>
                  <Link href={`/order/${order.number}`} className="block border border-line p-4 hover:border-gold">
                    <span className="font-serif text-2xl text-cream">{order.number}</span>
                    <span className="mt-1 block text-sm text-gold">{shipment.steps[shipment.current].label}</span>
                    <span className="mt-1 block text-sm text-mute">{shipment.tracking} · {order.shipping.city || "—"} · {formatDay(shipment.eta)}</span>
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
        {order.items.length === 0 ? <p className="mt-4 text-sm text-mute">Open the confirmation for the line items.</p> : (
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => (
              <li key={`${item.name}-${item.metal}-${item.size}`} className="flex gap-3 py-3">
                <div className="relative h-16 w-16 shrink-0 bg-card">
                  {item.image ? <Image src={item.image} alt="" fill className="object-cover" sizes="64px" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-cream">{item.name}</p>
                  <p className="text-xs text-mute">{item.metal} · {item.size} · Qty {item.qty}</p>
                </div>
                <p className="text-sm text-gold-2">{pkr(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
          {order.discount > 0 ? <div className="flex justify-between text-mute"><dt>Discount</dt><dd>-{pkr(order.discount)}</dd></div> : null}
          <div className="flex justify-between text-mute"><dt>Delivery</dt><dd>{order.shippingFee ? pkr(order.shippingFee) : "Free"}</dd></div>
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
          {paymentLabel(order.payment)} · {paymentStatusLabel(order.paymentStatus)}
          {order.cardLast4 ? ` · ending ${order.cardLast4}` : ""}
        </p>
        {order.paymentStatus === "failed" ? <p className="mt-3 text-sm text-blush">The payment did not clear. The house still has the order on file.</p> : null}
      </section>
    </div>
  );
}
