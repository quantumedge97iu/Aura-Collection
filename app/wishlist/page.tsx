import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return <WishlistView />;
}
