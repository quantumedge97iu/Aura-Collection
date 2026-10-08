"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { paymentLabel, useStore, type PaymentMethod } from "@/components/store";
import { Button, Container, EmptyState, Field, PageHeader, fieldClass } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn, pkr } from "@/lib/format";
import { arrivalDate, formatDay } from "@/lib/shipment";

const methods: Array<{ id: PaymentMethod; title: string; text: string }> = [
  { id: "cod", title: "Cash on Delivery", text: "Pay when the parcel is in your hands." },
  { id: "bank", title: "Bank Transfer", text: "Transfer the total, then we pack the order." },
  { id: "card", title: "Debit / Credit Card", text: "The last four digits are kept. Payment stays pending until it clears." },
];

type Errors = Partial<Record<"name" | "phone" | "email" | "city" | "address" | "card" | "expiry" | "cvc", string>>;

export function CheckoutView() {
  const router = useRouter();
  const { ready, cart, subtotal, placeOrder, session, city: savedCity, setDeliverTo, cities } = useStore();
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const nameValue = name ?? session?.name ?? "";
  const emailValue = email ?? session?.email ?? "";
  const [city, setCity] = useState<string | null>(null);
  const cityValue = city ?? savedCity;
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading checkout</Container>;

  if (cart.length === 0) {
    return (
      <Container className="py-10 sm:py-14">
        <PageHeader eyebrow="Checkout" title="Payment" />
        <div className="mt-8">
          <EmptyState title="Nothing to check out" text="Add a piece to your bag before choosing a payment method." href="/shop" action="Shop the collection" />
        </div>
      </Container>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (nameValue.trim().length < 3) next.name = "Enter the full name for the parcel.";
    if (!/^(\+92|0)?3\d{9}$/.test(phone.replace(/\s/g, ""))) next.phone = "Use a Pakistan mobile number.";
    if (!emailValue.includes("@") || !emailValue.includes(".")) next.email = "Enter a valid email.";
    if (!cityValue) next.city = "Choose a city.";
    if (address.trim().length < 8) next.address = "Add the street, area, and house number.";
    const digits = card.replace(/\s/g, "");
    if (payment === "card") {
      if (!/^\d{16}$/.test(digits)) next.card = "Enter 16 digits. Only the last four are sent.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) next.expiry = "Use MM/YY.";
      if (!/^\d{3,4}$/.test(cvc)) next.cvc = "Enter the 3 or 4 digit code.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    setFormError("");
    placeOrder(
      { name: nameValue.trim(), phone: phone.trim(), email: emailValue.trim(), city: cityValue, address: address.trim(), notes: notes.trim() },
      payment,
      payment === "card" ? digits.slice(-4) : undefined,
    ).then((order) => router.push(`/order/${order.number}`)).catch((reason: unknown) => {
      setFormError(reason instanceof ApiError ? reason.message : "The order could not be placed.");
    }).finally(() => setBusy(false));
  }

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Checkout" title="Delivery & payment" subtitle="Free insured delivery. Choose cash, a transfer, or a card." />
      <form onSubmit={submit} className="mt-8 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]" noValidate>
        <div className="space-y-8">
          <section className="border border-line p-4 sm:p-6">
            <h2 className="font-serif text-2xl text-cream">1. Where it ships</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={nameValue} onChange={(event) => setName(event.target.value)} error={errors.name} autoComplete="name" />
              <Field label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} error={errors.phone} placeholder="03XX XXXXXXX" autoComplete="tel" />
              <div className="sm:col-span-2">
                <Field label="Email" type="email" value={emailValue} onChange={(event) => setEmail(event.target.value)} error={errors.email} autoComplete="email" />
              </div>
              <label className="block">
                <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">City</span>
                <select value={cityValue} onChange={(event) => { setCity(event.target.value); setDeliverTo(event.target.value); }} className={cn(fieldClass, "bg-ink")}>
                  {cities.map((item) => <option key={item.city}>{item.city}</option>)}
                </select>
              </label>
              <div className="sm:col-span-2">
                <Field label="Address" value={address} onChange={(event) => setAddress(event.target.value)} error={errors.address} autoComplete="street-address" />
              </div>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Notes</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={fieldClass} placeholder="Gate code, best time, engraving" />
              </label>
            </div>
          </section>

          <section className="border border-line p-4 sm:p-6">
            <h2 className="font-serif text-2xl text-cream">2. Payment method</h2>
            <div className="mt-5 grid gap-3">
              {methods.map((method) => (
                <label key={method.id} className={cn("flex cursor-pointer gap-3 border p-4", payment === method.id ? "border-gold" : "border-line")}>
                  <input type="radio" name="payment" checked={payment === method.id} onChange={() => setPayment(method.id)} className="mt-1 accent-[#c6a36a]" />
                  <span>
                    <span className="block text-sm text-cream">{method.title}</span>
                    <span className="mt-1 block text-sm text-mute">{method.text}</span>
                  </span>
                </label>
              ))}
            </div>
            {payment === "bank" ? (
              <div className="mt-4 border border-gold/30 bg-ink p-4 text-sm leading-6 text-mute">
                <p className="text-cream">Bank Alfalah · Demo account</p>
                <p>Title: Aura Loom Diamond</p>
                <p>IBAN: PK00 AURA 0000 0000 1234 5678</p>
                <p className="mt-2">Use your order number as the transfer reference. The payment stays pending until it is recorded.</p>
              </div>
            ) : null}
            {payment === "card" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Card number" inputMode="numeric" autoComplete="off" value={card} onChange={(event) => setCard(event.target.value)} error={errors.card} placeholder="4242 4242 4242 4242" />
                </div>
                <Field label="Expiry" value={expiry} onChange={(event) => setExpiry(event.target.value)} error={errors.expiry} placeholder="MM/YY" autoComplete="off" />
                <Field label="CVC" value={cvc} onChange={(event) => setCvc(event.target.value)} error={errors.cvc} placeholder="123" autoComplete="off" />
                <p className="text-xs text-mute sm:col-span-2">The full card number is not saved. Only the last four digits stay on the confirmation.</p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="border border-gold/30 bg-panel p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl text-cream">Order</h2>
          <ul className="mt-4 divide-y divide-line">
            {cart.map((line) => (
                <li key={line.variantId} className="flex gap-3 py-3">
                  <div className="relative h-16 w-16 shrink-0 bg-card">
                    {line.image ? <Image src={line.image} alt="" fill className="object-cover" sizes="64px" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-cream">{line.name}</p>
                    <p className="text-xs text-mute">{line.metal} · {line.size} · Qty {line.qty}</p>
                  </div>
                </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-mute"><dt>Subtotal</dt><dd>{pkr(subtotal)}</dd></div>
            <div className="flex justify-between text-mute"><dt>Delivery</dt><dd>{(cities.find((item) => item.city === cityValue)?.fee ?? 0) > 0 ? pkr(cities.find((item) => item.city === cityValue)?.fee ?? 0) : "Free"} · {formatDay(arrivalDate(cityValue, new Date(), false, cities.find((item) => item.city === cityValue)?.transitDays).toISOString())}</dd></div>
            <div className="flex justify-between text-cream"><dt>Total</dt><dd>{pkr(subtotal + (cities.find((item) => item.city === cityValue)?.fee ?? 0))}</dd></div>
            <div className="flex justify-between text-mute"><dt>Method</dt><dd>{paymentLabel(payment)}</dd></div>
          </dl>
          {formError ? <p className="mt-4 text-sm text-blush">{formError}</p> : null}
          <Button type="submit" className="mt-6 w-full" disabled={busy}>{busy ? "Placing order" : "Place order"}</Button>
        </aside>
      </form>
    </Container>
  );
}
