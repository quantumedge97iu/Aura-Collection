"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    api("/v1/subscribe", { method: "POST", body: JSON.stringify({ email: email.trim() }) })
      .then(() => setDone(true))
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : "The list could not be saved."))
      .finally(() => setBusy(false));
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      {done ? (
        <p className="text-sm text-gold-2">You are on the list. New pieces will reach {email}.</p>
      ) : (
        <>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            aria-label="Email address"
            className="h-11 min-w-0 flex-1 border border-gold/40 bg-transparent px-4 text-sm outline-none placeholder:text-mute focus:border-gold"
          />
          <Button type="submit" className="h-11" disabled={busy}>{busy ? "Please wait" : "Subscribe"}</Button>
        </>
      )}
      {error ? <p className="text-sm text-blush" role="alert">{error}</p> : null}
    </form>
  );
}

export function OpenAura({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("open-aura"))}>
      {children}
    </button>
  );
}
