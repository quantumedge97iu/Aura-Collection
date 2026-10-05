import type { Metadata } from "next";
import { TrackView } from "@/components/order-view";

export const metadata: Metadata = { title: "Track Order" };

export default function TrackPage() {
  return <TrackView />;
}
