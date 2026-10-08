import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { fetchProducts } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop gold and diamond jewelry from Aura Loom Diamond.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const listing = await fetchProducts({ limit: 12 });
  return (
    <CatalogView
      eyebrow="The House"
      title="Shop All"
      subtitle="Gold, diamonds, and pieces made to be worn for years."
      products={listing.products}
      nextCursor={listing.nextCursor}
      metals={listing.metals}
      query={{}}
    />
  );
}
