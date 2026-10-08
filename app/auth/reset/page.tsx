import type { Metadata } from "next";
import { ResetView } from "@/components/reset-view";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPage() {
  return <ResetView />;
}
