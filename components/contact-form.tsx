"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button, Field, fieldClass } from "@/components/ui";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    api("/v1/contact", {
      method: "POST",
      body: JSON.stringify({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        message: String(data.get("message") ?? ""),
      }),
    })
      .then(() => setSent(true))
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : "The message could not be saved."))
      .finally(() => setBusy(false));
  }

  if (sent) {
    return <p className="border border-gold/40 p-5 text-sm text-gold-2">Message received. The studio will reply from the inbox.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Name" name="name" required minLength={3} />
      <Field label="Email" name="email" type="email" required />
      <label className="block">
        <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Message</span>
        <textarea name="message" required minLength={10} rows={5} className={fieldClass} />
      </label>
      {error ? <p className="text-sm text-blush" role="alert">{error}</p> : null}
      <Button type="submit" className="w-fit" disabled={busy}>{busy ? "Please wait" : "Send"}</Button>
    </form>
  );
}
