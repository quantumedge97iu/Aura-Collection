import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { collections } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Edited jewelry collections from Luxe Jewels.",
};

export default function CollectionsPage() {
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Edits" title="Collections" subtitle="Smaller sets from the house, gathered for a reason." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Link key={collection.slug} href={`/collections/${collection.slug}`} className="group relative min-h-[320px] overflow-hidden border border-gold/25">
            <Image src={collection.image} alt="" fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="font-serif text-3xl text-cream">{collection.title}</h2>
              <p className="mt-2 text-sm text-cream/80">{collection.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
