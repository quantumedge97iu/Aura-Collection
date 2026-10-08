import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { ApiError } from "@/lib/api";
import { editorialCollection } from "@/lib/cms";
import { fetchCollection } from "@/lib/shop";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [collection, editorial] = await Promise.all([fetchCollection(slug), editorialCollection(slug)]);
    return { title: editorial?.seo?.title || collection.title, description: editorial?.seo?.description || editorial?.intro || collection.subtitle };
  } catch {
    return { title: "Collection" };
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const [collection, editorial] = await Promise.all([fetchCollection(slug), editorialCollection(slug)]);
    const metals = Array.from(new Set(collection.products.flatMap((product) => product.metals)));
    return <CatalogView eyebrow={editorial?.eyebrow || "Collection"} title={editorial?.title || collection.title} subtitle={editorial?.intro || collection.subtitle} products={collection.products} nextCursor={null} metals={metals} query={{}} mode="local" />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
