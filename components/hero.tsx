"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { ButtonLink, Container } from "@/components/ui";
import { cn } from "@/lib/format";

const slides = [
  {
    label: "Collection",
    title: ["Jewelry,", "refined."],
    text: "Hallmarked gold and diamonds, finished in Karachi and delivered across Pakistan.",
    cta: "Shop the collection",
    href: "/shop",
    image: "/media/hero-portrait.jpg",
    alt: "Woman wearing a gold diamond necklace, chandelier earrings, and a statement ring",
    focus: "center 16%",
  },
  {
    label: "Bridal",
    title: ["Vows,", "in gold."],
    text: "Chokers, sets, and heirlooms made for the ceremony and the celebrations after.",
    cta: "Shop bridal",
    href: "/shop/bridal",
    image: "/media/bridal-choker.jpg",
    alt: "Ornate bridal gold choker on black velvet",
    focus: "center center",
  },
  {
    label: "The house",
    title: ["Elegant", "by nature."],
    text: "More than an accessory. A reflection of the person who wears it.",
    cta: "Read our story",
    href: "/story",
    image: "/media/promo-hands.jpg",
    alt: "Hands wearing stacked gold rings",
    focus: "center center",
  },
];

const assurances = ["Hallmarked gold", "Free delivery", "Cash on delivery"];

export function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[index];

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 7000);
    return () => window.clearInterval(id);
  }, [index, paused]);

  function go(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  return (
    <section
      className="bg-ink"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="flex flex-col lg:grid lg:min-h-[min(780px,calc(100svh-7.5rem))] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative order-2 h-[58svh] min-h-[360px] lg:h-auto lg:min-h-full">
          {slides.map((item, itemIndex) => (
            <div
              key={item.href}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                itemIndex === index ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={item.image}
                alt={itemIndex === index ? item.alt : ""}
                fill
                priority={itemIndex === 0}
                className="hero-photo"
                style={{ objectPosition: item.focus }}
                sizes="(min-width:1024px) 58vw, 100vw"
              />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-ink to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-ink to-transparent lg:hidden" />
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 lg:bottom-6 lg:left-6">
            <p className="text-[11px] tracking-[0.22em] text-cream uppercase" aria-live="polite">
              0{index + 1} <span className="text-gold/70">/</span> 0{slides.length}
            </p>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(index - 1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-ink/50 text-cream backdrop-blur-sm hover:border-gold hover:text-gold"
            >
              <Icon name="chevron" className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(index + 1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-ink/50 text-cream backdrop-blur-sm hover:border-gold hover:text-gold"
            >
              <Icon name="chevron" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="order-1 flex items-center px-5 pt-6 pb-2 sm:px-8 sm:pt-8 sm:pb-6 lg:px-12 lg:py-16 xl:px-16">
          <div className="@container w-full max-w-lg">
            <h1 className="font-serif text-[clamp(1.7rem,12.4cqi,4.15rem)] font-medium leading-[1.05] tracking-[-0.03em] whitespace-nowrap text-cream">
              {slide.title[0]} <span className="text-gold-2">{slide.title[1]}</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-cream/80 sm:mt-5 sm:text-base sm:leading-7">{slide.text}</p>
            <div className="mt-6 flex flex-nowrap items-stretch gap-2 sm:mt-8 sm:gap-3">
              <ButtonLink href={slide.href} className="!h-11 !px-3 !text-[10px] !tracking-[0.06em] whitespace-nowrap sm:!h-auto sm:!px-5 sm:!py-3 sm:!text-[11px] sm:!tracking-[0.18em]">
                {slide.cta} <Icon name="arrow" className="h-3.5 w-3.5 shrink-0" />
              </ButtonLink>
              <ButtonLink href="/shop/new-arrivals" variant="line" className="!h-11 !px-3 !text-[10px] !tracking-[0.06em] whitespace-nowrap sm:!h-auto sm:!px-5 sm:!py-3 sm:!text-[11px] sm:!tracking-[0.18em]">
                New arrivals
              </ButtonLink>
            </div>
            <ul className="mt-5 flex flex-col gap-2 text-[11px] tracking-[0.12em] text-mute uppercase sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:tracking-[0.14em]">
              {assurances.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Icon name="check" className="h-3.5 w-3.5 text-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-3 border-t border-line sm:mt-10" role="tablist" aria-label="Hero slides">
              {slides.map((item, itemIndex) => {
                const active = itemIndex === index;
                return (
                  <button
                    key={item.href}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => go(itemIndex)}
                    className={cn(
                      "border-b px-1 py-3 text-left transition sm:py-4",
                      active ? "border-gold text-cream" : "border-transparent text-mute hover:text-cream",
                    )}
                  >
                    <span className="block text-[10px] tracking-[0.2em] text-gold">0{itemIndex + 1}</span>
                    <span className="mt-1 block text-[13px] leading-tight sm:text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
