"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { concierge } from "@/lib/assist";
import type { Product } from "@/lib/catalog";
import { fetchProducts } from "@/lib/shop";
import { cn, pkr } from "@/lib/format";

type ChatProduct = { slug: string; name: string; price: number; image: string };
type ChatMessage = { id: string; role: "aura" | "you"; text: string; products?: ChatProduct[] };

const prompts = ["Gold necklace under 50,000", "Bridal set", "A gift under 30,000", "Men's gold"];

const welcome: ChatMessage = {
  id: "welcome",
  role: "aura",
  text: "I am Aura, the house concierge. Tell me who it is for, the piece, or a budget, and I will pull from the collection.",
};

function AuraMark({ className }: { className?: string }) {
  return <img src="/media/aura-robot.png" alt="" className={cn("object-contain", className)} />;
}

export function Aura() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const thread = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const replyTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open || catalog.length > 0) return;
    fetchProducts({ limit: 48 }).then((page) => setCatalog(page.products)).catch(() => setCatalog([]));
  }, [open, catalog.length]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("open-aura", show);
    return () => window.removeEventListener("open-aura", show);
  }, []);

  useEffect(() => {
    if (!open) return;
    field.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const node = thread.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight });
  }, [messages, thinking, open]);

  useEffect(() => {
    return () => {
      if (replyTimer.current) window.clearTimeout(replyTimer.current);
    };
  }, []);

  function send(raw: string) {
    const query = raw.trim();
    if (!query || thinking) return;
    setMessages((current) => [...current, { id: `you-${Date.now()}`, role: "you", text: query }]);
    setText("");
    setThinking(true);
    replyTimer.current = window.setTimeout(() => {
      const answer = concierge(query, catalog);
      setMessages((current) => [
        ...current,
        {
          id: `aura-${Date.now()}`,
          role: "aura",
          text: answer.reply,
          products: answer.products.map((product) => ({
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image,
          })),
        },
      ]);
      setThinking(false);
    }, 420);
  }

  function reset() {
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    setThinking(false);
    setText("");
    setMessages([welcome]);
  }

  return (
    <div className="fixed right-3 bottom-3 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open ? (
        <section
          role="dialog"
          aria-label="Aura, jewelry concierge"
          className="flex h-[min(72vh,600px)] w-[min(calc(100vw-1.5rem),390px)] flex-col overflow-hidden rounded-2xl border border-gold/40 bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        >
          <header className="flex items-center gap-3 border-b border-gold/20 px-4 py-3">
            <AuraMark className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-[0.22em] text-gold uppercase">Ask Aura</p>
              <p className="truncate text-xs text-mute">Jewelry concierge · in the house</p>
            </div>
            <button type="button" onClick={reset} className="text-[10px] tracking-[0.14em] text-mute uppercase hover:text-gold">
              New
            </button>
            <button type="button" aria-label="Close concierge" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center text-gold">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </header>

          <div ref={thread} className="aura-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <article key={message.id} className={cn("flex gap-2", message.role === "you" && "justify-end")}>
                {message.role === "aura" ? (
                  <AuraMark className="mt-0.5 h-8 w-8 shrink-0" />
                ) : null}
                <div className={cn("max-w-[85%]", message.role === "you" && "max-w-[78%]")}>
                  <p className={cn("px-3 py-2.5 text-sm leading-6", message.role === "you" ? "bg-gold text-ink" : "border border-gold/25 bg-ink/50 text-cream")}>
                    {message.text}
                  </p>
                  {message.products && message.products.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {message.products.map((product) => (
                        <li key={product.slug}>
                          <a
                            href={`/product/${product.slug}`}
                            onClick={(event) => {
                              event.preventDefault();
                              router.push(`/product/${product.slug}`);
                              setOpen(false);
                            }}
                            className="flex items-center gap-3 border border-gold/25 bg-ink/40 p-2 transition hover:border-gold"
                          >
                            <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-card">
                              <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-serif text-base text-cream">{product.name}</span>
                              <span className="mt-0.5 block text-xs text-gold-2">{pkr(product.price)}</span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
            {thinking ? (
              <div className="flex gap-2">
                <AuraMark className="h-8 w-8 shrink-0" />
                <p className="border border-gold/25 bg-ink/50 px-3 py-3 text-gold" aria-label="Aura is looking">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:300ms]" />
                  </span>
                </p>
              </div>
            ) : null}
          </div>

          {messages.length === 1 && !thinking ? (
            <div className="flex flex-wrap gap-2 border-t border-white/5 px-4 py-3">
              {prompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => send(prompt)} className="border border-gold/30 px-2.5 py-1.5 text-left text-[11px] tracking-[0.04em] text-cream hover:border-gold hover:text-gold">
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(text);
            }}
            className="flex items-center gap-2 border-t border-gold/20 p-3"
          >
            <input
              ref={field}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask for a piece or a budget"
              aria-label="Message Aura"
              className="h-11 w-full border border-line bg-transparent px-3 text-sm outline-none placeholder:text-mute focus:border-gold"
            />
            <button type="submit" aria-label="Send message" disabled={!text.trim() || thinking} className="grid h-11 w-11 shrink-0 place-items-center bg-gold text-ink disabled:opacity-40">
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask Aura"
          className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-gold/40 bg-panel shadow-[0_16px_50px_rgba(0,0,0,0.45)]"
        >
          <AuraMark className="h-14 w-14" />
        </button>
      )}
    </div>
  );
}
