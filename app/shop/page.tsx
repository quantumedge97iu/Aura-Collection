import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getListing } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop gold and diamond jewelry from Luxe Jewels.",
};

export default function ShopPage() {
  const listing = getListing();
  if (!listing) return null;
  return <CatalogView {...listing} />;
}
