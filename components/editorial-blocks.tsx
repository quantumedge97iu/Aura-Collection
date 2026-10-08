import Image from "next/image";
import Link from "next/link";
import { ButtonLink, Container } from "@/components/ui";

export function EditorialBand({
  eyebrow,
  title,
  text,
  href,
  cta,
  image,
  alt,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  href?: string;
  cta?: string;
  image?: string;
  alt?: string;
}) {
  const body = (
    <>
      {image ? <Image src={image} alt={alt || title} fill sizes="100vw" className="object-cover transition duration-700 group-hover:scale-105" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/15" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        {eyebrow ? <p className="text-[10px] tracking-[0.28em] text-gold uppercase">{eyebrow}</p> : null}
        <h2 className="mt-2 font-serif text-4xl text-cream sm:text-5xl">{title}</h2>
        {text ? <p className="mt-3 max-w-md text-sm leading-6 text-cream/80">{text}</p> : null}
        {cta ? <span className="mt-5 inline-flex border border-gold/70 px-4 py-2.5 text-[11px] tracking-[0.16em] text-gold uppercase">{cta}</span> : null}
      </div>
    </>
  );
  return (
    <section className="py-12 sm:py-16">
      <Container>
        {href ? (
          <Link href={href} className="group relative block min-h-[340px] overflow-hidden border border-gold/30">{body}</Link>
        ) : (
          <div className="relative block min-h-[340px] overflow-hidden border border-gold/30">{body}</div>
        )}
      </Container>
    </section>
  );
}

export function EditorialSplit({
  eyebrow,
  title,
  paragraphs,
  href,
  cta,
  image,
  alt,
}: {
  eyebrow?: string;
  title: string;
  paragraphs?: string[];
  href?: string;
  cta?: string;
  image?: string;
  alt?: string;
}) {
  return (
    <Container className="py-10 sm:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden border border-gold/25 bg-card">
          {image ? <Image src={image} alt={alt || title} fill className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" priority /> : null}
        </div>
        <div>
          {eyebrow ? <p className="text-[11px] tracking-[0.32em] text-gold uppercase">{eyebrow}</p> : null}
          <h1 className="mt-3 font-serif text-5xl text-cream sm:text-6xl">{title}</h1>
          <div className="mt-5 space-y-4 text-sm leading-7 text-cream/80">
            {paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          {href && cta ? <ButtonLink href={href} className="mt-8">{cta}</ButtonLink> : null}
        </div>
      </div>
    </Container>
  );
}
