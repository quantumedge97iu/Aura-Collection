import type { Metadata } from "next";
import { ConfirmView } from "@/components/confirm-view";

export const metadata: Metadata = { title: "Confirm email" };

export default function ConfirmPage() {
  return <ConfirmView />;
}
