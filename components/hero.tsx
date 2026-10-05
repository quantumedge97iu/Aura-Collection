"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/format";

const slides = [
  {
    eyebrow: "Premium Jewelry Collection",
    title: ["Jewelry,", "Refined."],
    text: "Timeless pieces for every moment, crafted with passion, designed for you.",
    cta: "Shop Collection",
    href: "/shop",
    image: "/media/hero-portrait.jpg",
    alt: "Woman wearing a gold diamond necklace, chandelier earrings, and a statement ring",
    fit: "object-top",
  },
  {
    eyebrow: "The Bridal Edit",
    title: ["Vows,", "in gold."],
    text: "Chokers, sets, and heirlooms made for the ceremony and every celebration after.",
    cta: "Shop Bridal",
    href: "/shop/bridal",
    image: "/media/bridal-choker.jpg",
    alt: "Ornate bridal gold choker on black velvet",
    fit: "object-center",
  },
  {
    eyebrow: "The Art of Jewelry",
    title: ["Elegant", "by nature."],
    text: "More than an accessory. A reflection of the person who wears it.",
    cta: "Discover Our Story",
    href: "/story",
    image: "/media/promo-hands.jpg",
    alt: "Hands wearing stacked gold rings",
    fit: "object-center",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    const id = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 7000);
    return () => window.clearInterval(id);
  }, [index]);

  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="relative z-10 order-2 flex items-center px-5 py-12 sm:px-10 sm:py-16 lg:order-1 lg:min-h-[760px] lg:py-20 lg:pr-10 lg:pl-16">
          <div className="max-w-xl">
            <p className="text-[11px] tracking-[0.34em] text-gold uppercase sm:text-xs">{slide.eyebrow}</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] text-cream sm:text-6xl xl:text-7xl">
              {slide.title.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-cream/80 sm:text-base">{slide.text}</p>
            <ButtonLink href={slide.href} className="mt-8">
              {slide.cta} <Icon name="arrow" className="h-3.5 w-3.5" />
            </ButtonLink>
            <div className="mt-8 flex gap-2">
              {slides.map((item, itemIndex) => (
                <button key={item.href} type="button" aria-label={`Show slide ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)} className={cn("h-1.5 rounded-full transition-all", itemIndex === index ? "w-8 bg-gold" : "w-4 bg-cream/40")} />
              ))}
            </div>
          </div>
        </div>

        <div className="relative order-1 min-h-[78vw] sm:min-h-[520px] lg:order-2 lg:min-h-[760px]">
          {slides.map((item, itemIndex) => (
            <div key={item.href} className={cn("absolute inset-0 transition-opacity duration-700", itemIndex === index ? "opacity-100" : "opacity-0")}>
              <Image
                src={item.image}
                alt={itemIndex === index ? item.alt : ""}
                fill
                priority={itemIndex === 0}
                className={cn("object-cover", item.fit)}
                sizes="(min-width:1024px) 54vw, 100vw"
              />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink lg:via-ink/25 lg:to-transparent" />
          <p className="absolute top-8 right-6 z-10 hidden text-[10px] tracking-[0.42em] text-gold/90 uppercase [writing-mode:vertical-rl] xl:block">
            Luxury · Quality · Trust
          </p>
        </div>
      </div>

      <button type="button" aria-label="Previous slide" onClick={() => setIndex((index + slides.length - 1) % slides.length)} className="absolute bottom-6 left-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-ink/50 text-gold lg:top-1/2 lg:bottom-auto lg:left-5 lg:-translate-y-1/2">
        <Icon name="chevron" className="h-4 w-4 rotate-180" />
      </button>
      <button type="button" aria-label="Next slide" onClick={() => setIndex((index + 1) % slides.length)} className="absolute right-4 bottom-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-ink/50 text-gold lg:top-1/2 lg:right-5 lg:bottom-auto lg:-translate-y-1/2">
        <Icon name="chevron" className="h-4 w-4" />
      </button>
    </section>
  );
}
