"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { paymentLabel, paymentStatusLabel, useStore } from "@/components/store";
import { ButtonLink, Container } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { pkr } from "@/lib/format";
import { formatDay, shipmentOf } from "@/lib/shipment";

export function AccountView() {
  const { ready, session } = useStore();
  if (!ready) return <Container className="py-16 text-sm tracking-[0.16em] text-gold uppercase">Loading account</Container>;
  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      {session ? <ClientAccount /> : <AuthScreen />}
    </Container>
  );
}

type Panel = "overview" | "orders" | "addresses" | "payments" | "settings" | "help";

const panels: Array<{ id: Panel; label: string; icon: DashIconName }> = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "orders", label: "My Orders", icon: "bag" },
  { id: "addresses", label: "Addresses", icon: "pin" },
  { id: "payments", label: "Payment Methods", icon: "card" },
  { id: "settings", label: "Account Settings", icon: "settings" },
  { id: "help", label: "Help & Support", icon: "help" },
];

function ClientAccount() {
  const { session, signOut, orders, addresses, updateProfile, uploadAvatar, clearAvatar, addAddress, removeAddress, cities, setDeliverTo, requestPasswordReset } = useStore();
  const [panel, setPanel] = useState<Panel>("overview");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [line1, setLine1] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNote, setProfileNote] = useState("");
  const [addressError, setAddressError] = useState("");
  const [settingsNote, setSettingsNote] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  if (!session) return null;

  const nameValue = profileName ?? session.name;
  const phoneValue = phone ?? session.phone ?? "";
  const portrait = photoPreview ?? session.avatarUrl;
  const displayName = session.name.trim() || "Your account";
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "A";
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const inTransit = orders.filter((order) => {
    if (["cancelled", "delivered", "returned", "refunded"].includes(order.status)) return false;
    const step = shipmentOf(order).current;
    return step >= 3 && step < 5;
  }).length;
  const recent = orders.slice(0, 3);

  function openProfile() {
    setPanel("overview");
    window.setTimeout(() => document.getElementById("personal")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }

  function startAddress(address?: (typeof addresses)[number]) {
    setAddressError("");
    setAdding(true);
    if (!address) {
      setEditingId(null);
      setRecipient(nameValue);
      setLine1("");
      setAddressCity("");
      setAddressPhone(phoneValue);
      return;
    }
    setEditingId(address.id);
    setRecipient(address.fullName);
    setLine1(address.line1);
    setAddressCity(address.city);
    setAddressPhone(address.phone);
  }

  return (
    <div className="grid w-full items-start gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-6">
      <aside className="relative overflow-hidden rounded-2xl border border-[#c6a36a]/40 bg-[#0c0b09] px-4 py-6 lg:sticky lg:top-24">
        <div className="flex flex-col items-center text-center">
          <Portrait src={portrait} initials={initials} size={88} />
          <p className="mt-4 font-serif text-2xl text-cream">{displayName}</p>
          <p className="mt-1 text-xs text-mute">View and manage your account</p>
        </div>
        <nav className="mt-6 grid gap-1" aria-label="Account">
          {panels.map((item) => {
            const active = panel === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPanel(item.id)}
                className={active
                  ? "flex items-center gap-3 rounded-lg border border-[#c6a36a]/50 bg-[#1a1612] px-3 py-3 text-left text-sm text-gold"
                  : "flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-cream/80 hover:bg-white/[0.03] hover:text-cream"}
              >
                <DashIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                {active ? <DashIcon name="chevron" /> : null}
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={signOut} className="mt-4 flex w-full items-center gap-3 border-t border-[#c6a36a]/25 px-3 pt-4 text-left text-sm text-cream/80 hover:text-gold">
          <DashIcon name="logout" />
          Sign Out
        </button>
        <svg viewBox="0 0 280 80" className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 w-full text-[#c6a36a]/25" fill="none" aria-hidden>
          <path d="M0 50 C40 20 80 70 130 40 C180 10 220 60 280 28" stroke="currentColor" strokeWidth="0.6" />
          <path d="M0 64 C60 36 110 78 170 48 C210 28 240 58 280 42" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      </aside>

      <div className="min-w-0">
        <p className="text-xs text-mute">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="px-2 text-[#c6a36a]/50">/</span>
          <span className="text-cream">My Account</span>
        </p>

        {panel === "overview" ? (
          <>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-serif text-4xl text-[#e6d3ae] sm:text-5xl">
                  {hello}, {firstName}
                  {hour < 12 ? <span className="ml-2 inline-block align-middle text-gold" aria-hidden><DashIcon name="sun" /></span> : null}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-mute">Manage your orders, addresses, payment methods and account settings — all in one place.</p>
                {!phoneValue ? (
                  <p className="mt-4 max-w-xl rounded-xl border border-[#c6a36a]/40 bg-[#1a1612] px-4 py-3 text-sm leading-6 text-mute">Finish your profile below. Your name, phone, and addresses are saved on your account. Next time, use Sign in on this page for full access.</p>
                ) : null}
              </div>
              <button type="button" onClick={openProfile} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#c6a36a]/60 px-5 text-[11px] tracking-[0.16em] text-gold uppercase hover:bg-gold hover:text-ink">
                <DashIcon name="edit" />
                Edit Profile
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard icon="bag" value={orders.length} label="Total Orders" hint="Orders placed so far" />
              <StatCard icon="truck" value={inTransit} label="In Transit" hint="Orders on the way" />
              <StatCard icon="pin" value={addresses.length} label="Saved Addresses" hint="Addresses in your account" />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <section id="personal" className={cardClass}>
                <h2 className="font-serif text-2xl text-cream">Personal Information</h2>
                <p className="mt-1 text-sm text-mute">This is your profile. Save changes and they stay on your account.</p>
                <form
                  className="mt-5 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setProfileError("");
                    setProfileNote("");
                    if (nameValue.trim().length < 3) {
                      setProfileError("Enter your full name.");
                      return;
                    }
                    if (phoneValue.trim() && phoneValue.trim().length < 7) {
                      setProfileError("Enter a phone number we can reach.");
                      return;
                    }
                    setBusy(true);
                    const save = photoFile ? uploadAvatar(photoFile) : Promise.resolve();
                    save
                      .then(() => updateProfile({ fullName: nameValue.trim(), phone: phoneValue.trim() || null }))
                      .then(() => {
                        if (photoPreview) URL.revokeObjectURL(photoPreview);
                        setPhotoPreview(null);
                        setPhotoFile(null);
                        setProfileNote("Profile saved on your account.");
                      })
                      .catch((reason: unknown) => setProfileError(reason instanceof ApiError ? reason.message : "The profile could not be saved."))
                      .finally(() => setBusy(false));
                  }}
                >
                  <div className="flex items-center gap-4">
                    <Portrait src={portrait} initials={initials} size={80} />
                    <span className="grid gap-2">
                      <label className="inline-flex h-10 w-fit cursor-pointer items-center rounded-full border border-[#c6a36a]/60 px-4 text-[11px] tracking-[0.14em] text-gold uppercase hover:bg-gold hover:text-ink">
                        Upload photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (!file) return;
                            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1_200_000) {
                              setProfileError("Use a JPG, PNG, or WebP photo under 1.2 MB.");
                              return;
                            }
                            if (photoPreview) URL.revokeObjectURL(photoPreview);
                            setProfileError("");
                            setPhotoFile(file);
                            setPhotoPreview(URL.createObjectURL(file));
                          }}
                        />
                      </label>
                      {session.avatarUrl || photoPreview ? (
                        <button
                          type="button"
                          className="w-fit text-[11px] tracking-[0.14em] text-mute uppercase hover:text-gold"
                          onClick={() => {
                            if (photoPreview) URL.revokeObjectURL(photoPreview);
                            setPhotoPreview(null);
                            setPhotoFile(null);
                            if (session.avatarUrl) {
                              setBusy(true);
                              clearAvatar()
                                .catch((reason: unknown) => setProfileError(reason instanceof ApiError ? reason.message : "The photo could not be removed."))
                                .finally(() => setBusy(false));
                            }
                          }}
                        >
                          Remove photo
                        </button>
                      ) : null}
                      <span className="text-xs text-mute">JPG, PNG, or WebP. Under 1.2 MB. Saved with your profile.</span>
                    </span>
                  </div>
                  <AccountField label="Full name" icon="user" value={nameValue} onChange={(value) => { setProfileName(value); setProfileNote(""); }} autoComplete="name" />
                  <AccountField label="Email address" icon="mail" value={session.email} onChange={() => undefined} autoComplete="email" readOnly />
                  <AccountField label="Phone number" icon="phone" value={phoneValue} onChange={(value) => { setPhone(value); setProfileNote(""); }} autoComplete="tel" placeholder="03xx xxx xxxx" />
                  {profileError ? <p className="text-sm leading-6 text-blush" role="alert">{profileError}</p> : null}
                  {profileNote ? <p className="text-sm leading-6 text-gold-2" role="status">{profileNote}</p> : null}
                  <button type="submit" disabled={busy} className="h-12 w-full rounded-md bg-gold text-[11px] tracking-[0.22em] text-ink uppercase hover:bg-gold-2 disabled:opacity-50">
                    {busy ? "Please wait" : "Save changes"}
                  </button>
                </form>
              </section>

              <section className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl text-cream">Recent Orders</h2>
                    <p className="mt-1 text-sm text-mute">Track your recent orders and see what&apos;s coming next.</p>
                  </div>
                  {orders.length > 0 ? (
                    <button type="button" onClick={() => setPanel("orders")} className="shrink-0 text-[11px] tracking-[0.12em] text-gold uppercase hover:text-gold-2">
                      View all orders
                    </button>
                  ) : null}
                </div>
                {recent.length === 0 ? (
                  <div className="mt-8 flex flex-col items-center px-4 py-8 text-center">
                    <span className="text-gold"><DashIcon name="parcel" /></span>
                    <p className="mt-4 font-serif text-3xl text-cream">No orders yet</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-mute">When you place an order, the details, tracking information, and estimated delivery date will appear here.</p>
                    <ButtonLink href="/shop" className="mt-6">Browse collection</ButtonLink>
                  </div>
                ) : (
                  <ul className="mt-5 divide-y divide-[#c6a36a]/20">
                    {recent.map((order) => <OrderRow key={order.id} order={order} />)}
                  </ul>
                )}
              </section>
            </div>

            <AddressBook
              addresses={addresses}
              adding={adding}
              editingId={editingId}
              recipient={recipient}
              line1={line1}
              addressCity={addressCity}
              addressPhone={addressPhone}
              addressError={addressError}
              cities={cities}
              onRecipient={setRecipient}
              onLine1={setLine1}
              onCity={setAddressCity}
              onPhone={setAddressPhone}
              onAdd={() => startAddress()}
              onEdit={startAddress}
              onRemove={removeAddress}
              onCancel={() => { setAdding(false); setEditingId(null); setAddressError(""); }}
              onSubmit={(event) => {
                event.preventDefault();
                setAddressError("");
                const current = addresses.find((item) => item.id === editingId);
                if (recipient.trim().length < 3) {
                  setAddressError("Enter the name for this address.");
                  return;
                }
                if (addressPhone.trim().length < 7) {
                  setAddressError("Add a phone number for the courier.");
                  return;
                }
                if (line1.trim().length < 4) {
                  setAddressError("Enter the street address.");
                  return;
                }
                if (addressCity.trim().length < 2) {
                  setAddressError("Choose a city.");
                  return;
                }
                const previousId = editingId;
                addAddress({
                  fullName: recipient.trim(),
                  phone: addressPhone.trim(),
                  line1: line1.trim(),
                  city: addressCity,
                  isDefaultShipping: current ? current.isDefaultShipping : addresses.length === 0,
                })
                  .then(() => {
                    if (previousId) removeAddress(previousId);
                    setDeliverTo(addressCity);
                    setAdding(false);
                    setEditingId(null);
                    setLine1("");
                    setAddressCity("");
                  })
                  .catch((reason: unknown) => setAddressError(reason instanceof ApiError ? reason.message : "The address could not be saved."));
              }}
            />
          </>
        ) : null}

        {panel === "orders" ? (
          <section className={`${cardClass} mt-4`}>
            <h1 className="font-serif text-3xl text-cream">My Orders</h1>
            <p className="mt-1 text-sm text-mute">Every piece you have ordered, with tracking and payment.</p>
            {orders.length === 0 ? (
              <div className="mt-8 flex flex-col items-center py-10 text-center">
                <span className="text-gold"><DashIcon name="parcel" /></span>
                <p className="mt-4 font-serif text-3xl text-cream">No orders yet</p>
                <ButtonLink href="/shop" className="mt-6">Browse collection</ButtonLink>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-[#c6a36a]/20">
                {orders.map((order) => <OrderRow key={order.id} order={order} />)}
              </ul>
            )}
          </section>
        ) : null}

        {panel === "addresses" ? (
          <div className="mt-4">
            <AddressBook
              addresses={addresses}
              adding={adding}
              editingId={editingId}
              recipient={recipient}
              line1={line1}
              addressCity={addressCity}
              addressPhone={addressPhone}
              addressError={addressError}
              cities={cities}
              onRecipient={setRecipient}
              onLine1={setLine1}
              onCity={setAddressCity}
              onPhone={setAddressPhone}
              onAdd={() => startAddress()}
              onEdit={startAddress}
              onRemove={removeAddress}
              onCancel={() => { setAdding(false); setEditingId(null); setAddressError(""); }}
              onSubmit={(event) => {
                event.preventDefault();
                setAddressError("");
                const current = addresses.find((item) => item.id === editingId);
                if (recipient.trim().length < 3) {
                  setAddressError("Enter the name for this address.");
                  return;
                }
                if (addressPhone.trim().length < 7) {
                  setAddressError("Add a phone number for the courier.");
                  return;
                }
                if (line1.trim().length < 4) {
                  setAddressError("Enter the street address.");
                  return;
                }
                if (addressCity.trim().length < 2) {
                  setAddressError("Choose a city.");
                  return;
                }
                const previousId = editingId;
                addAddress({
                  fullName: recipient.trim(),
                  phone: addressPhone.trim(),
                  line1: line1.trim(),
                  city: addressCity,
                  isDefaultShipping: current ? current.isDefaultShipping : addresses.length === 0,
                })
                  .then(() => {
                    if (previousId) removeAddress(previousId);
                    setDeliverTo(addressCity);
                    setAdding(false);
                    setEditingId(null);
                    setLine1("");
                    setAddressCity("");
                  })
                  .catch((reason: unknown) => setAddressError(reason instanceof ApiError ? reason.message : "The address could not be saved."));
              }}
            />
          </div>
        ) : null}

        {panel === "payments" ? (
          <section className={`${cardClass} mt-4`}>
            <h1 className="font-serif text-3xl text-cream">Payment Methods</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">You choose how to pay when you check out. Card numbers are not stored on this profile. Cash on delivery and bank transfer stay available on every order.</p>
            <ul className="mt-6 grid gap-3">
              {[
                ["Cash on delivery", "Pay the courier when the piece arrives."],
                ["Bank transfer", "Transfer against your order number. Payment stays pending until it is recorded."],
                ["Debit or credit card", "Entered at checkout. Only the last four digits stay on the order."],
              ].map(([title, text]) => (
                <li key={title} className="rounded-xl border border-[#c6a36a]/30 px-4 py-4">
                  <p className="text-sm text-cream">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-mute">{text}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {panel === "settings" ? (
          <section className={`${cardClass} mt-4`}>
            <h1 className="font-serif text-3xl text-cream">Account Settings</h1>
            <p className="mt-2 text-sm text-mute">The email you verified is the one you sign in with.</p>
            <p className="mt-6 text-[11px] tracking-[0.18em] text-mute uppercase">Email</p>
            <p className="mt-2 text-cream">{session.email}</p>
            <form
              className="mt-8"
              onSubmit={(event) => {
                event.preventDefault();
                setSettingsError("");
                setSettingsNote("");
                setBusy(true);
                requestPasswordReset(session.email)
                  .then(() => setSettingsNote("A reset link is on its way to your email."))
                  .catch((reason: unknown) => setSettingsError(reason instanceof ApiError ? reason.message : "The reset email could not be sent."))
                  .finally(() => setBusy(false));
              }}
            >
              <p className="text-sm leading-6 text-mute">To change your password, we email a link to {session.email}.</p>
              {settingsError ? <p className="mt-3 text-sm text-blush" role="alert">{settingsError}</p> : null}
              {settingsNote ? <p className="mt-3 text-sm text-gold-2" role="status">{settingsNote}</p> : null}
              <button type="submit" disabled={busy} className="mt-4 h-12 rounded-md border border-[#c6a36a]/70 px-6 text-[11px] tracking-[0.18em] text-gold uppercase hover:bg-gold hover:text-ink disabled:opacity-50">
                {busy ? "Please wait" : "Email a password reset"}
              </button>
            </form>
          </section>
        ) : null}

        {panel === "help" ? (
          <section className={`${cardClass} mt-4`}>
            <h1 className="font-serif text-3xl text-cream">Help & Support</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">Delivery, returns, hallmarks, and the studio line.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/help">Open help</ButtonLink>
              <ButtonLink href="/policies/privacy" variant="line">Privacy</ButtonLink>
              <ButtonLink href="/policies/terms" variant="line">Terms</ButtonLink>
              <ButtonLink href="/track" variant="line">Track an order</ButtonLink>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function AuthScreen() {
  const { signIn, register, resendConfirmation, requestPasswordReset } = useStore();
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

  function openPanel(next: "in" | "up") {
    setPanel(next);
    setMode("in");
    setError("");
    setNote("");
    setNotice("");
  }

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

  function resend() {
    setBusy(true);
    setError("");
    setNotice("in");
    resendConfirmation(pendingEmail)
      .then(() => setNote(`Another confirmation link is on its way to ${pendingEmail}.`))
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : "The email could not be sent."))
      .finally(() => setBusy(false));
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

  const title = mode === "forgot" ? "Reset your password" : panel === "up" ? "Create an account" : "Sign in";
  const eyebrow = mode === "forgot" ? "Password" : panel === "up" ? "Join Aura Loom" : "Welcome back";
  const text = mode === "forgot"
    ? "Enter the email on your account. We will send a link to choose a new password."
    : panel === "up"
      ? "Create your account. Then your profile dashboard opens so you can save your name, phone, and addresses."
      : "Access your account and continue your journey with Aura Loom.";

  return (
    <div className="mx-auto w-full max-w-[440px] rounded-2xl border border-[#c6a36a]/45 bg-[#100e0c] px-5 py-8 shadow-[0_0_0_1px_rgba(198,163,106,0.08)] sm:px-8">
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/aura-loom-mark.svg" alt="" width={42} height={42} className="h-10 w-10" />
        <p className="mt-4 font-serif text-2xl tracking-[0.28em] text-cream">AURA LOOM</p>
        <p className="mt-1 text-[10px] tracking-[0.34em] text-gold">FINE JEWELLERY</p>
      </div>

      {mode === "in" ? (
        <div className="mt-8 grid grid-cols-2 gap-3" role="tablist" aria-label="Account">
          <button type="button" role="tab" aria-selected={panel === "in"} onClick={() => openPanel("in")} className={panel === "in" ? "h-11 rounded-md bg-gradient-to-b from-[#e6d3ae] to-[#c6a36a] text-[12px] tracking-[0.2em] text-ink uppercase" : "h-11 rounded-md border border-[#c6a36a]/55 text-[12px] tracking-[0.2em] text-cream uppercase hover:border-gold"}>Login</button>
          <button type="button" role="tab" aria-selected={panel === "up"} onClick={() => openPanel("up")} className={panel === "up" ? "h-11 rounded-md bg-gradient-to-b from-[#e6d3ae] to-[#c6a36a] text-[12px] tracking-[0.2em] text-ink uppercase" : "h-11 rounded-md border border-[#c6a36a]/55 text-[12px] tracking-[0.2em] text-cream uppercase hover:border-gold"}>Sign up</button>
        </div>
      ) : null}

      <p className="mt-8 text-[11px] tracking-[0.28em] text-gold uppercase">{eyebrow}</p>
      <h1 className="mt-2 font-serif text-4xl text-cream">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-mute">{text}</p>

      {panel === "in" && mode === "forgot" ? (
        <form onSubmit={sendReset} className="mt-6 grid gap-4" noValidate>
          <GoldField id="reset-email" label="Email address" icon="mail" type="email" value={signEmail} onChange={setSignEmail} placeholder="name@email.com" autoComplete="email" />
          {error ? <p className="text-sm leading-6 text-blush" role="alert">{error}</p> : null}
          {note ? <p className="text-sm leading-6 text-gold-2" role="status">{note}</p> : null}
          <AuthButton busy={busy} label={busy ? "Please wait" : "Send reset link"} />
          <p className="text-center text-sm text-mute">
            Remembered it?{" "}
            <button type="button" onClick={() => openPanel("in")} className="text-gold underline decoration-gold/40 underline-offset-4">Back to sign in</button>
          </p>
        </form>
      ) : panel === "in" ? (
        <form onSubmit={(event) => submit(event, "in")} className="mt-6 grid gap-4" noValidate>
          <GoldField id="sign-email" label="Email address" icon="mail" type="email" value={signEmail} onChange={setSignEmail} placeholder="name@email.com" autoComplete="email" />
          <GoldField
            id="sign-password"
            label="Password"
            icon="shield"
            type={showSignPassword ? "text" : "password"}
            value={signPassword}
            onChange={setSignPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            labelAction={
              <button type="button" onClick={() => { setMode("forgot"); setError(""); setNote(""); setNotice(""); }} className="text-[11px] text-gold hover:text-gold-2">
                Forgot password?
              </button>
            }
            trailing={<EyeButton shown={showSignPassword} onClick={() => setShowSignPassword((value) => !value)} />}
          />
          {notice === "in" && error ? <p className="text-sm leading-6 text-blush" role="alert">{error}</p> : null}
          {notice === "in" && note ? <p className="text-sm leading-6 text-gold-2" role="status">{note}</p> : null}
          {pendingEmail ? (
            <button type="button" onClick={resend} disabled={busy} className="w-fit text-[11px] tracking-[0.16em] text-gold uppercase hover:text-gold-2 disabled:opacity-50">
              Resend confirmation email
            </button>
          ) : null}
          <AuthButton busy={busy && notice === "in"} label={busy && notice === "in" ? "Please wait" : "Sign in"} />
          <p className="flex items-start gap-2 text-xs leading-5 text-mute">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>Your information is safe and secure. We use encryption to protect your data. Read the <Link href="/policies/privacy" className="text-gold underline decoration-gold/40 underline-offset-4">Privacy Policy</Link>.</span>
          </p>
          <p className="text-center text-sm text-mute">
            New here?{" "}
            <button type="button" onClick={() => openPanel("up")} className="text-gold underline decoration-gold/40 underline-offset-4">Create an account</button>
          </p>
        </form>
      ) : (
        <form onSubmit={(event) => submit(event, "up")} className="mt-6 grid gap-4" noValidate>
          <GoldField id="register-name" label="Full name" icon="user" value={name} onChange={setName} placeholder="Your full name" autoComplete="name" />
          <GoldField id="register-email" label="Email address" icon="mail" type="email" value={regEmail} onChange={setRegEmail} placeholder="name@email.com" autoComplete="email" />
          <GoldField
            id="register-password"
            label="Password"
            icon="shield"
            type={showRegPassword ? "text" : "password"}
            value={regPassword}
            onChange={setRegPassword}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            trailing={<EyeButton shown={showRegPassword} onClick={() => setShowRegPassword((value) => !value)} />}
          />
          <GoldField
            id="register-confirm"
            label="Confirm password"
            icon="shield"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat the password"
            autoComplete="new-password"
            trailing={<EyeButton shown={showConfirm} onClick={() => setShowConfirm((value) => !value)} />}
          />
          {confirm && regPassword !== confirm ? <p className="text-sm text-blush">The passwords do not match.</p> : null}
          {notice === "up" && error ? <p className="text-sm leading-6 text-blush" role="alert">{error}</p> : null}
          {notice === "up" && note ? <p className="text-sm leading-6 text-gold-2" role="status">{note}</p> : null}
          <AuthButton busy={busy && notice === "up"} label={busy && notice === "up" ? "Please wait" : "Create account"} />
          <p className="text-xs leading-5 text-mute">
            By creating an account, you agree to our <Link href="/policies/terms" className="text-gold underline decoration-gold/40 underline-offset-4">Terms</Link> and <Link href="/policies/privacy" className="text-gold underline decoration-gold/40 underline-offset-4">Privacy Policy</Link>.
          </p>
          <p className="text-center text-sm text-mute">
            Already registered?{" "}
            <button type="button" onClick={() => openPanel("in")} className="text-gold underline decoration-gold/40 underline-offset-4">Sign in</button>
          </p>
        </form>
      )}
    </div>
  );
}

function AuthButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#e6d3ae] to-[#c6a36a] text-[12px] tracking-[0.22em] text-ink uppercase hover:from-[#f3e6c8] hover:to-[#d4b57a] disabled:opacity-50">
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}

function Portrait({ src, initials, size }: { src: string | null; initials: string; size: number }) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full border border-[#c6a36a]/70 bg-gradient-to-b from-[#2a241c] to-[#14110e] font-serif text-[#e6d3ae]"
      style={{ width: size, height: size, minWidth: size, minHeight: size, maxWidth: size, maxHeight: size }}
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 object-cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span className="grid h-full w-full place-items-center" style={{ fontSize: size > 70 ? 28 : 22 }}>{initials}</span>
      )}
    </span>
  );
}

const cardClass = "rounded-2xl border border-[#c6a36a]/35 bg-[#100e0c] p-5 sm:p-6";

function StatCard({ icon, value, label, hint }: { icon: DashIconName; value: number; label: string; hint: string }) {
  return (
    <div className={`${cardClass} flex items-center gap-4`}>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#c6a36a]/50 text-gold">
        <DashIcon name={icon} />
      </span>
      <span>
        <span className="block text-[11px] tracking-[0.16em] text-mute uppercase">{label}</span>
        <span className="mt-1 block font-serif text-4xl text-cream">{String(value).padStart(2, "0")}</span>
        <span className="mt-1 block text-xs text-mute">{hint}</span>
      </span>
    </div>
  );
}

function OrderRow({ order }: { order: ReturnType<typeof useStore>["orders"][number] }) {
  const shipment = shipmentOf(order);
  const step = shipment.steps[shipment.current];
  return (
    <li>
      <Link href={`/order/${order.number}`} className="flex flex-col gap-3 py-4 hover:text-gold sm:flex-row sm:items-center sm:justify-between">
        <span>
          <span className="block font-serif text-2xl text-cream">{order.number}</span>
          <span className="mt-1 block text-sm text-gold">{step?.label ?? order.status} · arrives {formatDay(shipment.eta)}</span>
          <span className="mt-1 block text-sm text-mute">{shipment.tracking} · {order.shipping.city || "—"} · {paymentLabel(order.payment)} · {paymentStatusLabel(order.paymentStatus)}</span>
        </span>
        <span className="flex items-center gap-4">
          <span className="text-gold-2">{pkr(order.total)}</span>
          <span className="border border-gold/70 px-3 py-2 text-[11px] tracking-[0.16em] text-gold uppercase">Track</span>
        </span>
      </Link>
    </li>
  );
}

function AddressBook({
  addresses, adding, editingId, recipient, line1, addressCity, addressPhone, addressError, cities,
  onRecipient, onLine1, onCity, onPhone, onAdd, onEdit, onRemove, onCancel, onSubmit,
}: {
  addresses: ReturnType<typeof useStore>["addresses"];
  adding: boolean;
  editingId: string | null;
  recipient: string;
  line1: string;
  addressCity: string;
  addressPhone: string;
  addressError: string;
  cities: ReturnType<typeof useStore>["cities"];
  onRecipient: (value: string) => void;
  onLine1: (value: string) => void;
  onCity: (value: string) => void;
  onPhone: (value: string) => void;
  onAdd: () => void;
  onEdit: (address: ReturnType<typeof useStore>["addresses"][number]) => void;
  onRemove: (id: string) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <section className={`${cardClass} mt-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-cream">Saved Addresses</h2>
          <p className="mt-1 max-w-xl text-sm text-mute">These are the addresses you can use at checkout. You can edit, remove or add new addresses anytime.</p>
        </div>
        <button type="button" onClick={onAdd} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#c6a36a]/60 px-4 text-[11px] tracking-[0.14em] text-gold uppercase hover:bg-gold hover:text-ink">
          <Icon name="plus" className="h-3.5 w-3.5" />
          Add new address
        </button>
      </div>
      {addresses.length === 0 && !adding ? (
        <p className="mt-6 text-sm leading-6 text-mute">No address yet. Add the street and city you want pieces sent to.</p>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-xl border border-[#c6a36a]/30 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c6a36a]/40 text-gold">
                  <DashIcon name="home" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-cream">
                    {address.fullName}
                    {address.isDefaultShipping ? <span className="rounded-full border border-[#c6a36a]/50 px-2 py-0.5 text-[10px] tracking-[0.14em] text-gold uppercase">Default</span> : null}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-mute">
                    {address.line1}<br />
                    {address.city}{address.province ? `, ${address.province}` : ""}<br />
                    {address.country || "Pakistan"}
                  </p>
                  <p className="mt-3 text-sm">
                    <button type="button" onClick={() => onEdit(address)} className="text-gold hover:text-gold-2">Edit</button>
                    <span className="px-2 text-mute">|</span>
                    <button type="button" onClick={() => onRemove(address.id)} className="text-blush hover:text-cream">Remove</button>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <form className="mt-6 grid gap-4 border-t border-[#c6a36a]/20 pt-6" onSubmit={onSubmit}>
          <p className="font-serif text-xl text-cream">{editingId ? "Edit address" : "New address"}</p>
          <AccountField label="Full name" icon="user" value={recipient} onChange={onRecipient} autoComplete="name" />
          <AccountField label="Phone" icon="phone" value={addressPhone} onChange={onPhone} autoComplete="tel" placeholder="03xx xxx xxxx" />
          <AccountField label="Street" icon="pin" value={line1} onChange={onLine1} autoComplete="address-line1" placeholder="House, street, area" />
          <label className="block">
            <span className="mb-2 block text-[11px] tracking-[0.18em] text-mute uppercase">City</span>
            <select value={addressCity} onChange={(event) => onCity(event.target.value)} className="h-12 w-full rounded-md border border-[#c6a36a]/35 bg-transparent px-3.5 text-sm text-cream outline-none focus:border-gold">
              <option value="" className="bg-ink">Select a city</option>
              {cities.map((item) => <option key={item.city} value={item.city} className="bg-ink">{item.city}</option>)}
            </select>
          </label>
          {addressError ? <p className="text-sm leading-6 text-blush" role="alert">{addressError}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="h-11 rounded-md bg-gold px-6 text-[11px] tracking-[0.18em] text-ink uppercase hover:bg-gold-2">Save address</button>
            <button type="button" onClick={onCancel} className="h-11 rounded-md border border-line px-6 text-[11px] tracking-[0.18em] text-mute uppercase hover:text-cream">Cancel</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function AccountField({ label, value, onChange, autoComplete, placeholder, readOnly = false, icon }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string; placeholder?: string; readOnly?: boolean; icon?: IconName }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] tracking-[0.18em] text-mute uppercase">{label}</span>
      <span className="relative block">
        {icon ? <Icon name={icon} className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gold" /> : null}
        <input
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          className={`h-12 w-full rounded-md border border-[#c6a36a]/35 bg-transparent text-base text-cream outline-none placeholder:text-mute/70 read-only:text-mute focus:border-gold ${icon ? "pr-3.5 pl-11" : "px-3.5"}`}
        />
      </span>
    </label>
  );
}

type DashIconName = "grid" | "bag" | "pin" | "card" | "settings" | "help" | "chevron" | "logout" | "sun" | "edit" | "truck" | "parcel" | "home" | "user";

function DashIcon({ name }: { name: DashIconName }) {
  const common = { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: 1.4, "aria-hidden": true } as const;
  if (name === "sun") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
      </svg>
    );
  }
  if (name === "parcel") {
    return (
      <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <path d="M4 8.5 12 4.5l8 4v9L12 21.5 4 17.5v-9Z" />
        <path d="M12 12.2 20 8.2M12 12.2 4 8.2M12 12.2V21" />
        <path d="M15 6.2 9 9" />
      </svg>
    );
  }
  const paths: Record<Exclude<DashIconName, "sun" | "parcel">, React.ReactNode> = {
    grid: (<><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></>),
    bag: (<><path d="M6.5 8.5h11l-.8 11h-9.4l-.8-11Z" /><path d="M9 8.5V7.2A3 3 0 0 1 12 4a3 3 0 0 1 3 3.2v1.3" /></>),
    pin: (<><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" /><circle cx="12" cy="11" r="1.8" /></>),
    card: (<><rect x="3" y="6" width="18" height="12" rx="1.5" /><path d="M3 10h18" /></>),
    settings: (<><circle cx="12" cy="12" r="3" /><path d="M12 3.8v2.1M12 18.1v2.1M3.8 12h2.1M18.1 12h2.1M6.1 6.1l1.5 1.5M16.4 16.4l1.5 1.5M17.9 6.1l-1.5 1.5M7.6 16.4l-1.5 1.5" /></>),
    help: (<><circle cx="12" cy="12" r="8" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.8.3-1.2.8-1.2 1.6V14" /><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" /></>),
    chevron: <path d="m9 6 6 6-6 6" />,
    logout: (<><path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" /><path d="M13 12h7M16.5 8.5 20 12l-3.5 3.5" /></>),
    edit: <path d="M4 16.5V20h3.5L18.2 9.3 14.7 5.8 4 16.5ZM13.5 7l3.5 3.5" />,
    truck: (<><path d="M3 7.5h11v8H3v-8Z" /><path d="M14 10.5h4.2L21 13.5v2h-7" /><circle cx="7" cy="17.5" r="1.4" /><circle cx="17" cy="17.5" r="1.4" /></>),
    home: (<><path d="M4 11.5 12 5l8 6.5" /><path d="M7 10.5V19h10v-8.5" /></>),
    user: (<><circle cx="12" cy="8" r="3" /><path d="M6 19c1.2-2.6 3.2-3.8 6-3.8s4.8 1.2 6 3.8" /></>),
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function GoldField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  trailing,
  labelAction,
  icon,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  trailing?: React.ReactNode;
  labelAction?: React.ReactNode;
  icon?: IconName;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-[11px] tracking-[0.18em] text-mute uppercase">{label}</label>
        {labelAction}
      </div>
      <div className="relative">
        {icon ? <Icon name={icon} className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gold" /> : null}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className={`h-12 w-full rounded-md border border-[#c6a36a]/45 bg-transparent pr-12 text-base text-cream outline-none placeholder:text-mute/70 focus:border-gold ${icon ? "pl-11" : "pl-3.5"}`}
        />
        {trailing ? <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</span> : null}
      </div>
    </div>
  );
}

function EyeButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={shown ? "Hide password" : "Show password"} className="grid h-9 w-9 place-items-center text-mute hover:text-gold">
      <EyeIcon off={shown} />
    </button>
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
