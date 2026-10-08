import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { specialListings } from "@/lib/catalog";
import { fetchCategories, fetchProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const special = specialListings[category as keyof typeof specialListings];
  if (special) return { title: special.title, description: special.subtitle };
  const categories = await fetchCategories();
  const match = categories.find((item) => item.slug === category);
  if (!match) return { title: "Collection" };
  return { title: match.label, description: match.subtitle };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const special = specialListings[category as keyof typeof specialListings];
  if (special) {
    const listing = await fetchProducts({ tag: special.tag, limit: 12 });
    return <CatalogView eyebrow={special.eyebrow} title={special.title} subtitle={special.subtitle} products={listing.products} nextCursor={listing.nextCursor} metals={listing.metals} query={{ tag: special.tag }} />;
  }
  const categories = await fetchCategories();
  const match = categories.find((item) => item.slug === category);
  if (!match) notFound();
  const listing = await fetchProducts({ category, limit: 12 });
  return <CatalogView eyebrow="Category" title={match.label} subtitle={match.subtitle} products={listing.products} nextCursor={listing.nextCursor} metals={listing.metals} query={{ category }} />;
}
