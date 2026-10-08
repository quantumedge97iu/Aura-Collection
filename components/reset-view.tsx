"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/store";
import { ApiError, api } from "@/lib/api";

export function ResetView() {
  const router = useRouter();
  const { ready, acceptSession } = useStore();
  const [token, setToken] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const failure = hash.get("error_description") || query.get("error_description");
    const kind = hash.get("type") || query.get("type");
    const access = hash.get("access_token");
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    if (failure) setProblem(failure.replace(/\+/g, " "));
    else if (kind && kind !== "recovery") setProblem("This link is not a password reset. Request a new one from the account page.");
    else if (!access) setProblem("This reset link is missing or has expired. Request a new one from the account page.");
    else setToken(access);
    setChecked(true);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 6 || password.length > 72) {
      setError("Use 6 to 72 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    if (!token || !ready) return;
    setBusy(true);
    try {
      await api("/v1/auth/reset", { method: "POST", token, body: JSON.stringify({ password }) });
      try {
        await acceptSession(token);
        router.replace("/account");
      } catch {
        setDone(true);
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "The password could not be updated.");
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

          {!checked ? (
            <p className="mt-8 text-center text-sm text-mute">Opening your reset link.</p>
          ) : problem ? (
            <div className="mt-8 text-center">
              <p className="text-[11px] tracking-[0.28em] text-gold-2/90 uppercase">Password reset</p>
              <h1 className="mt-2 font-serif text-[36px] leading-none text-cream">Link expired</h1>
              <p className="mt-4 text-sm leading-6 text-mute">{problem}</p>
              <Link href="/account" className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] px-6 text-[12px] tracking-[0.18em] text-ink uppercase">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="mt-8 text-center">
              <p className="text-[11px] tracking-[0.28em] text-gold-2/90 uppercase">Password reset</p>
              <h1 className="mt-2 font-serif text-[36px] leading-none text-cream">Password updated</h1>
              <p className="mt-4 text-sm leading-6 text-mute">Your new password is saved. Sign in with it to open your account.</p>
              <Link href="/account" className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] px-6 text-[12px] tracking-[0.18em] text-ink uppercase">
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8" noValidate>
              <p className="text-[11px] tracking-[0.28em] text-gold-2/90 uppercase">Password reset</p>
              <h1 className="mt-1 font-serif text-[36px] leading-none text-cream">Choose a new password</h1>
              <p className="mt-3 text-sm leading-6 text-mute">Use 6 to 72 characters. You will sign in with this password from now on.</p>
              <div className="mt-7 grid gap-4">
                <SecretField id="new-password" label="New password" value={password} onChange={setPassword} shown={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" placeholder="Create a new password" />
                <SecretField id="confirm-password" label="Confirm password" value={confirm} onChange={setConfirm} shown={showConfirm} onToggle={() => setShowConfirm((value) => !value)} autoComplete="new-password" placeholder="Repeat the new password" />
                {error ? <p className="text-sm leading-6 text-blush">{error}</p> : null}
                <button type="submit" disabled={busy || !ready} className="mt-1 flex h-12 w-full items-center justify-center rounded-md bg-gradient-to-b from-[#e4d2ad] to-[#c6a36a] text-[12px] tracking-[0.18em] text-ink uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] disabled:opacity-50">
                  {busy ? "Please wait" : "Save password"}
                </button>
              </div>
              <p className="mt-5 text-center text-sm text-mute">
                <Link href="/account" className="text-gold underline decoration-gold/40 underline-offset-2 hover:text-gold-2">Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function SecretField({
  id,
  label,
  value,
  onChange,
  shown,
  onToggle,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  shown: boolean;
  onToggle: () => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[10px] tracking-[0.22em] text-gold-2/90 uppercase">{label}</label>
        <button type="button" onClick={onToggle} className="text-[11px] text-gold hover:text-gold-2">{shown ? "Hide" : "Show"}</button>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gold">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="5" y="10" width="14" height="10" rx="1.5" />
            <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
          </svg>
        </span>
        <input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-md border border-gold/45 bg-black/40 pr-11 pl-11 text-base text-cream outline-none placeholder:text-mute/75 focus:border-gold"
        />
        <button type="button" onClick={onToggle} aria-label={shown ? "Hide password" : "Show password"} className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center text-gold hover:text-gold-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.2" />
            {shown ? <path d="M4 19 20 5" /> : null}
          </svg>
        </button>
      </div>
    </div>
  );
}
