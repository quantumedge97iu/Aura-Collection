"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { type Order } from "@/components/store";
import { cn, pkr } from "@/lib/format";
import { formatDay, formatWhen, shipmentOf } from "@/lib/shipment";

export function ShipmentTrack({ order }: { order: Order }) {
  const shipment = shipmentOf(order);
  const current = shipment.steps[shipment.current];
  const delivered = shipment.current === shipment.steps.length - 1;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shipment.tracking);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="border border-gold/30 bg-panel p-4 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-gold uppercase">{current.label}</p>
          <h2 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">
            {delivered ? `Delivered ${formatDay(shipment.eta)}` : `Arrives ${formatDay(shipment.eta)}`}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-mute">{current.detail}</p>
        </div>
        <div className="border border-gold/25 bg-ink px-4 py-3 sm:min-w-56">
          <p className="text-[10px] tracking-[0.18em] text-mute uppercase">Tracking number</p>
          <p className="mt-1 font-serif text-2xl text-cream">{shipment.tracking}</p>
          <button type="button" onClick={copy} className="mt-2 text-[11px] tracking-[0.14em] text-gold uppercase">
            {copied ? "Copied" : "Copy"}
          </button>
          <p className="mt-3 text-sm text-mute">{shipment.courier}</p>
          <p className="text-sm text-mute">{shipment.city}</p>
          {order.payment === "cod" ? <p className="mt-2 text-sm text-gold-2">Collect {pkr(order.total)} on delivery</p> : null}
          {order.payment === "bank" ? <p className="mt-2 text-sm text-mute">Bank transfer · reference {order.id}</p> : null}
          {order.payment === "card" ? <p className="mt-2 text-sm text-mute">Card ending {order.cardLast4 ?? "----"} · not charged on this preview</p> : null}
        </div>
      </div>

      <ol className="mt-8">
        {shipment.steps.map((step, index) => {
          const state = index < shipment.current ? "done" : index === shipment.current ? "now" : "wait";
          return (
            <li key={step.key} className="grid grid-cols-[28px_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full border",
                    state === "wait" ? "border-line text-mute" : "border-gold bg-gold text-ink",
                  )}
                >
                  {state === "wait" ? <span className="h-1.5 w-1.5 rounded-full bg-mute" /> : <Icon name="check" className="h-3.5 w-3.5" />}
                </span>
                {index < shipment.steps.length - 1 ? <span className={cn("my-1 w-px flex-1", index < shipment.current ? "bg-gold" : "bg-line")} /> : null}
              </div>
              <div className={cn("pb-6", index === shipment.steps.length - 1 && "pb-0")}>
                <p className={cn("text-sm", state === "wait" ? "text-mute" : "text-cream")}>{step.label}</p>
                <p className="mt-0.5 text-xs text-mute">{step.place} · {formatWhen(step.at)}</p>
                {state === "now" ? <p className="mt-1 text-sm leading-6 text-gold-2">{step.detail}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-xs leading-5 text-mute">Luxe Dispatch moves this timeline from the order time and the delivery city. A live courier feed is not connected yet.</p>
    </section>
  );
}
