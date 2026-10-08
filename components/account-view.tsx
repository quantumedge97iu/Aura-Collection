"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { paymentLabel, paymentStatusLabel, useStore } from "@/components/store";
import { Button, Container, Field, PageHeader } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { pkr } from "@/lib/format";
import { formatDay, shipmentOf } from "@/lib/shipment";

export function AccountView() {
  const { ready, session, signIn, register, resendConfirmation, requestPasswordReset, signOut, orders, addresses, updateProfile, addAddress, removeAddress, cities } = useStore();
  const [name, setName] = useState("");
  const [signEmail, setSignEmail] = useState("");
  const [signPassword, setSignPassword] = useState("");
  const [showSignPassword, setShowSignPassword] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<"in" | "up" | "">("");
  const [panel, setPanel] = useState<"in" | "up">("in");
  const [mode, setMode] = useState<"in" | "forgot">("in");
  const [pendingEmail, setPendingEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [line1, setLine1] = useState("");
  const [addressCity, setAddressCity] = useState("");

  async function submit(event: React.FormEvent, next: "in" | "up") {
    event.preventDefault();
    setError("");
    setNote("");
    setNotice(next);
    const currentEmail = (next === "in" ? signEmail : regEmail).trim();
    const currentPassword = next === "in" ? signPassword : regPassword;
    if (next === "up" && name.trim().length < 3) {
      setError("Enter your name.");
      return;
    }
    if (!currentEmail.includes("@") || !currentEmail.includes(".")) {
      setError("Enter a valid email.");
      return;
    }
    if (currentPassword.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (next === "up" && regPassword !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (next === "up") {
        const pending = await register(name.trim(), currentEmail, regPassword);
        if (pending) {
          setPendingEmail(currentEmail);
          setNote(pending);
          setRegPassword("");
          setConfirm("");
        }
      } else {
        await signIn(currentEmail, signPassword);
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "email_not_confirmed") setPendingEmail(currentEmail);
      setError(reason instanceof ApiError ? reason.message : "Sign-in is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading account</Container>;

  if (session) {
    const nameValue = profileName ?? session.name;
    const phoneValue = phone ?? session.phone ?? "";
    return (
      <Container className="py-10 sm:py-14">
        <PageHeader eyebrow="Signed in" title={session.name.trim() || "Your account"} subtitle={session.email} />
        <Button variant="line" className="mt-6" onClick={signOut}>Sign out</Button>

        <section className="mt-10 max-w-lg">
          <h2 className="font-serif text-3xl text-cream">Profile</h2>
          <form
            className="mt-4 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setBusy(true);
              updateProfile({ fullName: nameValue.trim(), phone: phoneValue.trim() || null }).catch((reason: unknown) => {
                setError(reason instanceof ApiError ? reason.message : "The profile could not be saved.");
              }).finally(() => setBusy(false));
            }}
          >
            <Field label="Name" value={nameValue} onChange={(event) => setProfileName(event.target.value)} />
            <Field label="Phone" value={phoneValue} onChange={(event) => setPhone(event.target.value)} />
            {error ? <p className="text-sm text-blush">{error}</p> : null}
            <Button type="submit" className="w-fit" disabled={busy}>Save profile</Button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-3xl text-cream">Addresses</h2>
          {addresses.length === 0 ? <p className="mt-3 text-sm text-mute">No addresses yet.</p> : (
            <ul className="mt-4 divide-y divide-line border border-line">
              {addresses.map((address) => (
                <li key={address.id} className="flex items-start justify-between gap-4 p-4">
                  <p className="text-sm leading-6 text-mute">
                    {address.fullName}<br />{address.line1}<br />{address.city}
                    {address.isDefaultShipping ? <span className="mt-1 block text-gold">Default delivery</span> : null}
                  </p>
                  <button type="button" onClick={() => removeAddress(address.id)} className="text-xs tracking-[0.14em] text-mute uppercase hover:text-gold">Remove</button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-4 grid max-w-lg gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              addAddress({ fullName: nameValue.trim(), phone: phoneValue.trim() || session.phone || "03000000000", line1, city: addressCity || cities[0]?.city || "Karachi", isDefaultShipping: addresses.length === 0 }).then(() => setLine1("")).catch((reason: unknown) => {
                setError(reason instanceof ApiError ? reason.message : "The address could not be saved.");
              });
            }}
          >
            <Field label="Street" value={line1} onChange={(event) => setLine1(event.target.value)} />
            <label className="block">
              <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">City</span>
              <select value={addressCity || cities[0]?.city || ""} onChange={(event) => setAddressCity(event.target.value)} className="h-11 w-full border border-line bg-ink px-3 text-sm text-cream">
                {cities.map((item) => <option key={item.city}>{item.city}</option>)}
              </select>
            </label>
            <Button type="submit" variant="line" className="w-fit">Add address</Button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-3xl text-cream">Orders</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-mute">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border border-line">
              {orders.map((order) => {
                const shipment = shipmentOf(order);
                const step = shipment.steps[shipment.current];
                return (
                  <li key={order.id}>
                    <Link href={`/order/${order.number}`} className="flex flex-col gap-3 p-4 hover:bg-ink/40 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        <span className="block font-serif text-2xl text-cream">{order.number}</span>
                        <span className="block text-sm text-gold">{step.label} · arrives {formatDay(shipment.eta)}</span>
                        <span className="block text-sm text-mute">{shipment.tracking} · {order.shipping.city || "—"} · {paymentLabel(order.payment)} · {paymentStatusLabel(order.paymentStatus)}</span>
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

  function resend() {
    setBusy(true);
    setError("");
    setNotice("in");
    resendConfirmation(pendingEmail)
      .then(() => setNote(`Another confirmation link is on its way to ${pendingEmail}.`))
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : "The email could not be sent."))
      .finally(() => setBusy(false));
  }

  function openPanel(next: "in" | "up") {
    setPanel(next);
    setMode("in");
    setError("");
    setNote("");
    setNotice("");
  }

  async function sendReset(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNote("");
    setNotice("in");
    const email = signEmail.trim();
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setNote("If an account exists for that email, a reset link is on its way. Open it to choose a new password.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "The reset email could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-ink">
      <div className="flex items-start justify-center px-3 py-6 sm:px-6 sm:py-10 lg:py-12">
        <div className="w-full max-w-[440px] rounded-2xl border border-[#c6a36a]/40 bg-[#0c0a08] px-4 py-7 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:px-8 sm:py-9">
          <div className="flex flex-col items-center text-center">
            <img src="/brand/aura-loom-mark.svg" alt="" width={40} height={40} className="h-10 w-10" />
            <p className="mt-3 font-serif text-[20px] tracking-[0.28em] text-cream sm:text-[22px] sm:tracking-[0.32em]">AURA LOOM</p>
            <p className="mt-1 text-[9px] tracking-[0.42em] text-gold">FINE JEWELLERY</p>
          </div>

          {mode === "in" ? (
          <div className="mt-7 grid grid-cols-2 gap-1 rounded-md border border-gold/35 bg-black/40 p-1" role="tablist" aria-label="Account">
            <button type="button" role="tab" aria-selected={panel === "in"} onClick={() => openPanel("in")} className={panel === "in" ? "h-11 rounded-[5px] bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] text-[12px] tracking-[0.2em] text-ink uppercase" : "h-11 rounded-[5px] text-[12px] tracking-[0.2em] text-gold uppercase hover:text-gold-2"}>
              Login
            </button>
            <button type="button" role="tab" aria-selected={panel === "up"} onClick={() => openPanel("up")} className={panel === "up" ? "h-11 rounded-[5px] bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] text-[12px] tracking-[0.2em] text-ink uppercase" : "h-11 rounded-[5px] text-[12px] tracking-[0.2em] text-gold uppercase hover:text-gold-2"}>
              Sign up
            </button>
          </div>
          ) : null}

          {panel === "in" && mode === "forgot" ? (
          <form onSubmit={sendReset} className="mt-7" noValidate>
            <p className="text-[11px] tracking-[0.28em] text-gold-2/90 uppercase">Password reset</p>
            <h1 className="mt-1 font-serif text-[36px] leading-none text-cream">Forgot password</h1>
            <p className="mt-3 text-sm leading-6 text-mute">Enter the email on your account. We will send a link to choose a new password.</p>
            <div className="mt-7 grid gap-4">
              <GoldField id="reset-email" label="Email address" type="email" value={signEmail} onChange={setSignEmail} placeholder="name@email.com" autoComplete="email" icon={<Icon name="mail" className="h-4 w-4" />} />
              {notice === "in" && error ? <p className="text-sm leading-6 text-blush">{error}</p> : null}
              {notice === "in" && note ? <p className="text-sm leading-6 text-gold-2">{note}</p> : null}
              <button type="submit" disabled={busy} className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] text-[12px] tracking-[0.18em] text-ink uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] disabled:opacity-50">
                {busy ? "Please wait" : "Send reset link"}
              </button>
            </div>
            <p className="mt-5 text-center text-sm text-mute">
              Remembered it?{" "}
              <button type="button" onClick={() => openPanel("in")} className="text-gold underline decoration-gold/40 underline-offset-2 hover:text-gold-2">Back to login</button>
            </p>
          </form>
          ) : panel === "in" ? (
          <form onSubmit={(event) => submit(event, "in")} className="mt-7" noValidate>
            <p className="text-[11px] tracking-[0.28em] text-gold-2/90 uppercase">Welcome back</p>
            <h1 className="mt-1 font-serif text-[36px] leading-none text-cream">Sign in</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-mute">Access your account and continue your journey with Aura Loom.</p>
            <div className="mt-4 h-px w-16 bg-gradient-to-r from-gold to-transparent" />

            <div className="mt-7 grid gap-4">
              <GoldField id="sign-email" label="Email address" type="email" value={signEmail} onChange={setSignEmail} placeholder="name@email.com" autoComplete="email" icon={<Icon name="mail" className="h-4 w-4" />} />
              <GoldField
                id="sign-password"
                label="Password"
                type={showSignPassword ? "text" : "password"}
                value={signPassword}
                onChange={setSignPassword}
                placeholder="Enter your password"
                autoComplete="current-password"
                icon={<LockIcon />}
                labelAction={
                  <button type="button" onClick={() => { setMode("forgot"); setError(""); setNote(""); setNotice(""); }} className="text-[11px] text-gold-2/80 hover:text-gold">
                    Forgot password?
                  </button>
                }
                trailing={<EyeButton shown={showSignPassword} onClick={() => setShowSignPassword((value) => !value)} />}
              />
              {notice === "in" && error ? <p className="text-sm leading-6 text-blush">{error}</p> : null}
              {notice === "in" && note ? <p className="text-sm leading-6 text-gold-2">{note}</p> : null}
              {pendingEmail ? (
                <button type="button" onClick={resend} disabled={busy} className="w-fit text-[11px] tracking-[0.16em] text-gold uppercase hover:text-gold-2 disabled:opacity-50">
                  Resend confirmation email
                </button>
              ) : null}
              <button type="submit" disabled={busy} className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] text-[12px] tracking-[0.22em] text-ink uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] disabled:opacity-50 sm:tracking-[0.28em]">
                <Icon name="arrow" className="h-4 w-4 -scale-x-100" />
                {busy && notice === "in" ? "Please wait" : "Sign in"}
              </button>
            </div>

            <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-mute">
              <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span><span className="text-cream">Your information is safe and secure.</span> We use industry-standard encryption to protect your data.</span>
            </p>
            <p className="mt-5 text-center text-sm text-mute">
              New here?{" "}
              <button type="button" onClick={() => openPanel("up")} className="text-gold underline decoration-gold/40 underline-offset-2 hover:text-gold-2">Create an account</button>
            </p>
          </form>
          ) : (
          <form onSubmit={(event) => submit(event, "up")} className="mt-7" noValidate>
            <p className="text-[11px] tracking-[0.22em] text-gold uppercase">Join our exclusive community</p>
            <h1 className="mt-1 font-serif text-[32px] leading-none text-cream sm:text-[36px]">Create an account</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-mute">Be the first to know about new collections, special offers and exclusive events. A confirmation link arrives by email.</p>

            <ul className="mt-5 grid grid-cols-3 divide-x divide-gold/25 text-center">
              <li className="min-w-0 px-1 sm:px-2">
                <Mark className="mx-auto h-5 w-5 text-gold" />
                <p className="mt-2 text-[10px] leading-4 text-mute sm:text-[11px]">Track orders and delivery</p>
              </li>
              <li className="min-w-0 px-1 sm:px-2">
                <Icon name="pin" className="mx-auto h-5 w-5 text-gold" />
                <p className="mt-2 text-[10px] leading-4 text-mute sm:text-[11px]">Save addresses for checkout</p>
              </li>
              <li className="min-w-0 px-1 sm:px-2">
                <Icon name="heart" className="mx-auto h-5 w-5 text-gold" />
                <p className="mt-2 text-[10px] leading-4 text-mute sm:text-[11px]">Keep a wishlist in your name</p>
              </li>
            </ul>

            <div className="mt-6 grid gap-4">
              <GoldField id="register-name" label="Full name" value={name} onChange={setName} placeholder="Enter your full name" autoComplete="name" icon={<Icon name="user" className="h-4 w-4" />} />
              <GoldField id="register-email" label="Email address" type="email" value={regEmail} onChange={setRegEmail} placeholder="name@email.com" autoComplete="email" icon={<Icon name="mail" className="h-4 w-4" />} />
              <GoldField
                id="register-password"
                label="Password"
                type={showRegPassword ? "text" : "password"}
                value={regPassword}
                onChange={setRegPassword}
                placeholder="Create a password"
                autoComplete="new-password"
                icon={<LockIcon />}
                labelAction={<button type="button" onClick={() => setShowRegPassword((value) => !value)} className="text-[11px] text-gold hover:text-gold-2">{showRegPassword ? "Hide" : "Show"}</button>}
                trailing={<EyeButton shown={showRegPassword} onClick={() => setShowRegPassword((value) => !value)} />}
              />
              <GoldField
                id="register-confirm"
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={setConfirm}
                placeholder="Confirm your password"
                autoComplete="new-password"
                icon={<LockIcon />}
                trailing={<EyeButton shown={showConfirm} onClick={() => setShowConfirm((value) => !value)} />}
              />
              {notice === "up" && error ? <p className="text-sm leading-6 text-blush">{error}</p> : null}
              {notice === "up" && note ? <p className="text-sm leading-6 text-gold-2">{note}</p> : null}
              <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] text-[12px] tracking-[0.28em] text-ink uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] disabled:opacity-50">
                <Icon name="user" className="h-4 w-4" />
                {busy && notice === "up" ? "Please wait" : "Create account"}
              </button>
              <p className="text-center text-[11px] leading-5 text-mute">
                By creating an account, you agree to our{" "}
                <Link href="/policies/terms" className="text-gold underline decoration-gold/40 underline-offset-2">Terms & Conditions</Link>
                {" "}and{" "}
                <Link href="/policies/privacy" className="text-gold underline decoration-gold/40 underline-offset-2">Privacy Policy</Link>.
              </p>
              <p className="text-center text-sm text-mute">
                Already registered?{" "}
                <button type="button" onClick={() => openPanel("in")} className="text-gold underline decoration-gold/40 underline-offset-2 hover:text-gold-2">Login</button>
              </p>
            </div>
          </form>
          )}
        </div>
      </div>
    </section>
  );
}

function GoldField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  trailing,
  labelAction,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  labelAction?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[10px] tracking-[0.22em] text-gold-2/90 uppercase">{label}</label>
        {labelAction}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gold">{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-md border border-gold/45 bg-black/40 pr-11 pl-11 text-base text-cream outline-none placeholder:text-mute/75 focus:border-gold"
        />
        {trailing ? <span className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</span> : null}
      </div>
    </div>
  );
}

function EyeButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={shown ? "Hide password" : "Show password"} className="grid h-8 w-8 place-items-center text-gold hover:text-gold-2">
      <EyeIcon off={shown} />
    </button>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="1.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.2" />
      {off ? <path d="M4 19 20 5" /> : null}
    </svg>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M12 3 21 12 12 21 3 12Z" />
      <path d="M12 8 16 12 12 16 8 12Z" />
    </svg>
  );
}

