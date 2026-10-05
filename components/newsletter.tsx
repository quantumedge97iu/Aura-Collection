"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
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
            className="h-11 flex-1 border border-gold/40 bg-transparent px-4 text-sm outline-none placeholder:text-mute focus:border-gold"
          />
          <Button type="submit" className="h-11">Subscribe</Button>
        </>
      )}
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
