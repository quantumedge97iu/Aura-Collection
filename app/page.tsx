import { CategoryStrip, ProductRail, TrustBar } from "@/components/home-sections";
import { Hero } from "@/components/hero";
import { Reviews } from "@/components/reviews";
import { products } from "@/lib/catalog";

export default function HomePage() {
  const arrivals = products.filter((product) => product.tags.includes("new")).slice(0, 4);
  const sellers = products.filter((product) => product.tags.includes("bestseller")).slice(0, 4);

  return (
    <>
      <Hero />
      <CategoryStrip />
      <ProductRail
        title="New Arrivals"
        subtitle="Fresh designs. Timeless elegance."
        href="/shop/new-arrivals"
        products={arrivals}
        feature={{
          eyebrow: "New Arrivals",
          title: "Elegant By Nature",
          href: "/shop/new-arrivals",
          cta: "Shop now",
          image: "/media/promo-nature.jpg",
          alt: "Gold necklace on dark silk",
        }}
      />
      <ProductRail
        title="Best Sellers"
        subtitle="Loved by thousands, for a reason."
        href="/shop/bestsellers"
        products={sellers}
        feature={{
          eyebrow: "The House",
          title: "The Art of Jewelry",
          text: "More than just an accessory, it's a reflection of your story.",
          href: "/story",
          cta: "Discover our story",
          image: "/media/promo-hands.jpg",
          alt: "Hands wearing gold rings",
        }}
      />
      <TrustBar />
      <Reviews />
    </>
  );
}
