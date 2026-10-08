import { Container, ProductGridSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="h-4 w-24 animate-pulse bg-card" />
      <div className="mt-3 h-12 w-64 animate-pulse bg-card" />
      <ProductGridSkeleton />
    </Container>
  );
}
