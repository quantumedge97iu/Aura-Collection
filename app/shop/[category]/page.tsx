import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getListing, listingSlugs } from "@/lib/catalog";

export function generateStaticParams() {
  return listingSlugs().map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const listing = getListing(category);
  if (!listing) return { title: "Collection" };
  return { title: listing.title, description: listing.subtitle };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const listing = getListing(category);
  if (!listing) notFound();
  return <CatalogView {...listing} />;
}
