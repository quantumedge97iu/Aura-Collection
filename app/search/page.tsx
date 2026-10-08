import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Container, EmptyState, PageHeader } from "@/components/ui";
import { fetchSearch } from "@/lib/shop";

export const metadata: Metadata = { title: "Search" };

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await fetchSearch(query) : [];

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow="Search" title={query ? `Results for “${query}”` : "Search"} subtitle={query ? `${results.length} pieces` : "Look for a ring, a necklace, a metal, or a name."} />
      {!query || results.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={query ? "No pieces match" : "Start with a word"} text="Try ring, bridal, diamond, or pearl." href="/shop" action="Shop all" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">
          {results.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
