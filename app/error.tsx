"use client";

import { Button, Container } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-serif text-5xl text-cream">Something slipped</h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-mute">The page did not finish loading. Try it once more.</p>
      <Button className="mt-8" onClick={reset}>Try again</Button>
    </Container>
  );
}
