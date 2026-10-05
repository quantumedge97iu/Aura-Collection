import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-[11px] tracking-[0.32em] text-gold uppercase">404</p>
      <h1 className="mt-3 font-serif text-5xl text-cream">This piece is not in the house</h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-mute">The page may have moved. The collection is still here.</p>
      <ButtonLink href="/shop" className="mt-8">Shop the collection</ButtonLink>
    </Container>
  );
}
