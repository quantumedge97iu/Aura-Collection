"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/store";
import { Container, PageHeader } from "@/components/ui";
import { ApiError } from "@/lib/api";

export function ConfirmView() {
  const router = useRouter();
  const { ready, acceptSession } = useStore();
  const [message, setMessage] = useState("Confirming your email. Your profile will open next.");

  useEffect(() => {
    if (!ready) return;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const token = hash.get("access_token");
    const failure = hash.get("error_description") || query.get("error_description");
    if (failure) {
      setMessage(failure.replace(/\+/g, " "));
      return;
    }
    if (!token) {
      setMessage("This confirmation link is missing or has expired. Request a new one from the account page.");
      return;
    }
    acceptSession(token)
      .then(() => {
        setMessage("Email confirmed. Opening your profile.");
        router.replace("/account");
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof ApiError ? reason.message : "The confirmation could not be finished.");
      });
  }, [ready, acceptSession, router]);

  return (
    <Container className="py-16">
      <PageHeader eyebrow="Account" title="Email confirmation" subtitle={message} />
      <Link href="/account" className="mt-8 inline-block text-[11px] tracking-[0.16em] text-gold uppercase">Open your profile</Link>
    </Container>
  );
}
