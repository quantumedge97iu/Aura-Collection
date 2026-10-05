"use client";

import Link from "next/link";
import { useState } from "react";
import { paymentLabel, useClientReady, useStore } from "@/components/store";
import { Button, Container, Field, PageHeader } from "@/components/ui";
import { pkr } from "@/lib/format";
import { formatDay, shipmentOf } from "@/lib/shipment";

export function AccountView() {
  const { session, signIn, signOut, orders } = useStore();
  const ready = useClientReady();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters. The password stays in this form and is not stored.");
      return;
    }
    if (mode === "up") {
      if (name.trim().length < 3) {
        setError("Enter your name.");
        return;
      }
      if (password !== confirm) {
        setError("The passwords do not match.");
        return;
      }
      signIn({ name: name.trim(), email: email.trim() });
      return;
    }
    const local = email.split("@")[0]?.replace(/[._]/g, " ") ?? "Guest";
    const titled = local.replace(/\b\w/g, (letter) => letter.toUpperCase());
    signIn({ name: titled, email: email.trim() });
  }

  if (!ready) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading account</Container>;

  if (session) {
    return (
      <Container className="py-10 sm:py-14">
        <PageHeader eyebrow="Account" title={`Hello, ${session.name.split(" ")[0]}`} subtitle={session.email} />
        <Button variant="line" className="mt-6" onClick={signOut}>Sign out</Button>
        <section className="mt-10">
          <h2 className="font-serif text-3xl text-cream">Orders</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-mute">No orders on this device yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border border-line">
              {orders.map((order) => {
                const shipment = shipmentOf(order);
                const step = shipment.steps[shipment.current];
                return (
                  <li key={order.id}>
                    <Link href={`/order/${order.id}`} className="flex flex-col gap-3 p-4 hover:bg-ink/40 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        <span className="block font-serif text-2xl text-cream">{order.id}</span>
                        <span className="block text-sm text-gold">{step.label} · arrives {formatDay(shipment.eta)}</span>
                        <span className="block text-sm text-mute">{shipment.tracking} · {order.shipping.city} · {paymentLabel(order.payment)}</span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="text-gold-2">{pkr(order.total)}</span>
                        <span className="border border-gold/50 px-3 py-2 text-[11px] tracking-[0.14em] text-gold uppercase">Track</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Account"
        title={mode === "in" ? "Sign in" : "Create an account"}
        subtitle="This preview keeps the session on your device. Passwords are checked, then discarded."
      />
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => { setMode("in"); setError(""); }} className={mode === "in" ? "border border-gold px-4 py-2 text-[11px] tracking-[0.16em] text-gold uppercase" : "border border-line px-4 py-2 text-[11px] tracking-[0.16em] text-mute uppercase"}>Sign in</button>
        <button type="button" onClick={() => { setMode("up"); setError(""); }} className={mode === "up" ? "border border-gold px-4 py-2 text-[11px] tracking-[0.16em] text-gold uppercase" : "border border-line px-4 py-2 text-[11px] tracking-[0.16em] text-mute uppercase"}>Register</button>
      </div>
      <form onSubmit={submit} className="mt-6 grid max-w-lg gap-4" noValidate>
        {mode === "up" ? <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /> : null}
        <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} />
        {mode === "up" ? <Field label="Confirm password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" /> : null}
        {error ? <p className="text-sm text-blush">{error}</p> : null}
        <Button type="submit" className="w-fit">{mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>
    </Container>
  );
}
