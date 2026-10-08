import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product-view";
import { ApiError } from "@/lib/api";
import { editorialProduct } from "@/lib/cms";
import { fetchProduct, fetchProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [product, editorial] = await Promise.all([fetchProduct(slug), editorialProduct(slug)]);
    return { title: product.name, description: editorial?.seoDescription || product.description };
  } catch {
    return { title: "Piece" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const [product, editorial] = await Promise.all([fetchProduct(slug), editorialProduct(slug)]);
    const related = await fetchProducts({ category: product.category, limit: 8 });
    return <ProductView product={product} related={related.products.filter((item) => item.slug !== product.slug).slice(0, 4)} editorial={editorial?.paragraphs} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
