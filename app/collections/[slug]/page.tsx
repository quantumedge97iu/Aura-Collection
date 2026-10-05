import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { collections, getCollection } from "@/lib/catalog";

export function generateStaticParams() {
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection" };
  return { title: collection.title, description: collection.subtitle };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  return <CatalogView eyebrow="Collection" title={collection.title} subtitle={collection.subtitle} products={collection.products} />;
}
