import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Our Story",
  description: "The house behind Aura Loom Diamond.",
};

export default function StoryPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden border border-gold/25">
          <Image src="/media/promo-hands.jpg" alt="Hands wearing stacked gold rings" fill className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" priority />
        </div>
        <div>
          <p className="text-[11px] tracking-[0.32em] text-gold uppercase">The House</p>
          <h1 className="mt-3 font-serif text-5xl text-cream sm:text-6xl">The art of jewelry</h1>
          <div className="mt-5 space-y-4 text-sm leading-7 text-cream/80">
            <p>Aura Loom Diamond is a Karachi house making gold and diamond pieces for people who wear them, not store them. Every piece is hallmarked. Delivery is insured, and cash on delivery is available in every city we ship to.</p>
            <p>The collection stays small on purpose. New arrivals come in when a setting is right. Bridal sets are finished for the week of the wedding, then meant to be worn again.</p>
            <p>More than an accessory, a piece is a record of who it was bought for.</p>
          </div>
          <ButtonLink href="/shop/bridal" className="mt-8">Shop the bridal edit</ButtonLink>
        </div>
      </div>
    </Container>
  );
}
