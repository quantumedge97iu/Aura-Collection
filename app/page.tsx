import { EditorialBand } from "@/components/editorial-blocks";
import { Hero, type HeroSlide } from "@/components/hero";
import { CategoryStrip, ProductRail, TrustBar } from "@/components/home-sections";
import { Reviews } from "@/components/reviews";
import type { IconName } from "@/components/icons";
import { editorialHome, type CmsSection } from "@/lib/cms";
import { fetchCategories, fetchHouseReviews, fetchProducts } from "@/lib/shop";
import type { Product } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const trustIcons = new Set<IconName>(["shield", "card", "truck", "refresh"]);

function asHero(section: Extract<CmsSection, { _type: "heroSection" }>): HeroSlide[] {
  return (section.slides ?? []).flatMap((slide) => {
    if (!slide.image || !slide.titleLead || !slide.titleAccent || !slide.href) return [];
    return [{
      label: slide.label,
      title: [slide.titleLead, slide.titleAccent],
      text: slide.text,
      cta: slide.cta,
      href: slide.href,
      image: slide.image,
      alt: slide.alt || slide.label,
      focus: slide.focus || "center center",
    }];
  });
}

export default async function HomePage() {
  const [editorial, categories, reviews] = await Promise.all([
    editorialHome(),
    fetchCategories(),
    fetchHouseReviews(),
  ]);
  const sections = editorial?.sections ?? [];
  const tags = sections.flatMap((section) => (section._type === "productRailSection" && section.tag ? [section.tag] : []));
  const uniqueTags = [...new Set(tags)];
  const tagged = await Promise.all(uniqueTags.map(async (tag) => [tag, (await fetchProducts({ tag, limit: 4 })).products] as const));
  const byTag = new Map<string, Product[]>(tagged);

  if (sections.length === 0) {
    const [arrivals, sellers] = await Promise.all([
      fetchProducts({ tag: "new", limit: 4 }),
      fetchProducts({ tag: "bestseller", limit: 4 }),
    ]);
    return (
      <>
        <Hero />
        <CategoryStrip categories={categories} />
        <ProductRail
          title="New Arrivals"
          subtitle="Fresh designs. Timeless beauty."
          href="/shop/new-arrivals"
          products={arrivals.products}
          feature={{ eyebrow: "New Arrivals", title: "Elegant By Nature", href: "/shop/new-arrivals", cta: "Shop now", image: "/media/promo-nature.jpg", alt: "Gold necklace on dark silk" }}
        />
        <ProductRail
          title="Best Sellers"
          subtitle="Loved by thousands, for a reason."
          href="/shop/bestsellers"
          products={sellers.products}
          feature={{ eyebrow: "The House", title: "The Art of Jewelry", text: "More than just an accessory, it's a reflection of your story.", href: "/story", cta: "Discover our story", image: "/media/promo-hands.jpg", alt: "Hands wearing gold rings" }}
        />
        <TrustBar />
        <Reviews reviews={reviews} />
      </>
    );
  }

  const hero = sections.find((section) => section._type === "heroSection");
  const rest = sections.filter((section) => section._type !== "heroSection");

  return (
    <>
      {hero?._type === "heroSection" ? <Hero slides={asHero(hero)} assurances={hero.assurances} /> : <Hero />}
      <CategoryStrip categories={categories} />
      {rest.map((section) => {
        if (section._type === "productRailSection" && section.title && section.href && section.feature?.title && section.feature.href && section.feature.image) {
          return (
            <ProductRail
              key={section._key}
              title={section.title}
              subtitle={section.subtitle || ""}
              href={section.href}
              products={byTag.get(section.tag || "") ?? []}
              feature={{
                eyebrow: section.feature.eyebrow || "",
                title: section.feature.title,
                text: section.feature.text,
                href: section.feature.href,
                cta: section.feature.cta || "Shop now",
                image: section.feature.image,
                alt: section.feature.alt || section.feature.title,
              }}
            />
          );
        }
        if (section._type === "bannerSection" && section.title) {
          return <EditorialBand key={section._key} eyebrow={section.eyebrow} title={section.title} text={section.text} href={section.href} cta={section.cta} image={section.image} alt={section.alt} />;
        }
        if (section._type === "campaignSection" && section.campaign?.title) {
          return <EditorialBand key={section._key} eyebrow={section.campaign.eyebrow} title={section.campaign.title} text={section.campaign.summary} href={section.campaign.href} cta={section.campaign.cta} image={section.campaign.image} alt={section.campaign.alt} />;
        }
        if (section._type === "trustSection") {
          const items = (section.items ?? []).flatMap((item) => (item.icon && trustIcons.has(item.icon as IconName) && item.title && item.text ? [{ icon: item.icon as IconName, title: item.title, text: item.text }] : []));
          return <TrustBar key={section._key} items={items} />;
        }
        if (section._type === "faqSection" && section.faqs?.length) {
          return (
            <section key={section._key} className="py-12">
              <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">
                {section.title ? <h2 className="font-serif text-3xl text-cream">{section.title}</h2> : null}
                <div className="mt-6 divide-y divide-line border-y border-line">
                  {section.faqs.map((item) => (
                    <details key={item.question} className="group py-4">
                      <summary className="cursor-pointer list-none font-serif text-2xl text-cream">{item.question}</summary>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-mute">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          );
        }
        return null;
      })}
      <Reviews reviews={reviews} />
    </>
  );
}
