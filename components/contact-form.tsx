"use client";

import { useState } from "react";
import { Button, Field, fieldClass } from "@/components/ui";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return <p className="border border-gold/40 p-5 text-sm text-gold-2">Message noted on this device. Write to support@luxejewels.pk and the studio will reply once the inbox is connected.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Name" name="name" required minLength={3} />
      <Field label="Email" name="email" type="email" required />
      <label className="block">
        <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">Message</span>
        <textarea name="message" required minLength={10} rows={5} className={fieldClass} />
      </label>
      <Button type="submit" className="w-fit">Send</Button>
    </form>
  );
}
