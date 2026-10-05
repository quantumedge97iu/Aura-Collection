"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Container, Stars } from "@/components/ui";
import { reviews } from "@/lib/content";

export function Reviews() {
  const [index, setIndex] = useState(0);
  const visible = [0, 1, 2].map((offset) => reviews[(index + offset) % reviews.length]);

  return (
    <section className="py-14 sm:py-16">
      <Container>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl tracking-[0.14em] text-cream uppercase sm:text-3xl">What our customers say</h2>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous reviews" onClick={() => setIndex((index + reviews.length - 1) % reviews.length)} className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 text-gold">
              <Icon name="chevron" className="h-4 w-4 rotate-180" />
            </button>
            <button type="button" aria-label="Next reviews" onClick={() => setIndex((index + 1) % reviews.length)} className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 text-gold">
              <Icon name="chevron" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {visible.map((review, offset) => (
            <figure key={review.name} className={`border border-gold/25 bg-card p-5 ${offset > 0 ? "hidden md:block" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 font-serif text-lg text-gold">
                  {review.name.split(" ").map((part) => part[0]).join("")}
                </span>
                <figcaption>
                  <span className="block text-sm text-cream">{review.name}</span>
                  <span className="block text-xs text-mute">{review.city}</span>
                </figcaption>
              </div>
              <Stars value={review.rating} />
              <blockquote className="mt-3 text-sm leading-6 text-cream/85">“{review.quote}”</blockquote>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
