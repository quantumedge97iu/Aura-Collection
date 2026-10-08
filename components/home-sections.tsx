import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { Container } from "@/components/ui";
import type { Category, Product } from "@/lib/catalog";

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <section className="border-b border-gold/15 py-8 sm:py-10">
      <Container>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-10">
          {categories.map((category) => (
            <Link key={category.slug} href={`/shop/${category.slug}`} className="group border border-gold/25 bg-card">
              <div className="relative aspect-square overflow-hidden">
                <Image src={category.image} alt="" fill sizes="120px" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <span className="block px-1 py-2 text-center text-[9px] leading-tight tracking-[0.08em] text-cream uppercase sm:py-2.5 sm:text-[10px] sm:tracking-[0.14em]">{category.label}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function ProductRail({
  title,
  subtitle,
  href,
  products,
  feature,
}: {
  title: string;
  subtitle: string;
  href: string;
  products: Product[];
  feature: { eyebrow: string; title: string; text?: string; href: string; cta: string; image: string; alt: string };
}) {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-[0.08em] text-cream uppercase sm:text-3xl sm:tracking-[0.16em]">{title}</h2>
            <p className="mt-1 font-serif text-base text-gold italic sm:text-lg">{subtitle}</p>
          </div>
          <Link href={href} className="shrink-0 text-[11px] tracking-[0.16em] text-gold uppercase">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
          <Link href={feature.href} className="group relative col-span-2 min-h-[340px] overflow-hidden border border-gold/30 md:col-span-1">
            <Image src={feature.image} alt={feature.alt} fill sizes="(min-width:1280px) 20vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/15" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="text-[10px] tracking-[0.14em] text-gold uppercase sm:tracking-[0.28em]">{feature.eyebrow}</p>
              <h3 className="mt-2 font-serif text-3xl leading-none text-cream sm:text-4xl">{feature.title}</h3>
              {feature.text ? <p className="mt-3 max-w-[16rem] text-sm leading-6 text-cream/80">{feature.text}</p> : null}
              <span className="mt-5 inline-flex border border-gold/70 px-4 py-2.5 text-[11px] tracking-[0.16em] text-gold uppercase">{feature.cta} →</span>
            </div>
          </Link>
        </div>
      </Container>
    </section>
  );
}

const trusts: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: "shield", title: "Authenticity Guaranteed", text: "100% genuine jewelry" },
  { icon: "card", title: "Secure Payments", text: "COD | Bank Transfer | Card" },
  { icon: "truck", title: "Insured Delivery", text: "Your order, our responsibility" },
  { icon: "refresh", title: "Easy Returns", text: "Hassle-free within 7 days" },
];

export function TrustBar({ items }: { items?: Array<{ icon: IconName; title: string; text: string }> }) {
  const rows = items?.length ? items : trusts;
  return (
    <section className="border-y border-gold/15">
      <Container className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((item) => (
          <div key={item.title} className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/50 text-gold">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-cream">{item.title}</span>
              <span className="mt-0.5 block text-xs text-mute">{item.text}</span>
            </span>
          </div>
        ))}
      </Container>
    </section>
  );
}
