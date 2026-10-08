export type Variant = {
  id: string;
  sku: string;
  metal: string;
  size: string;
  price: number;
  available: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  categoryLabel: string;
  appearsIn: string[];
  image: string;
  brand: string;
  tags: string[];
  metals: string[];
  sizes: string[];
  sku: string;
  rating: number;
  reviewCount: number;
  description: string;
  details: string[];
  defaultVariant: Variant | null;
  variants: Variant[];
};

export type Category = {
  slug: string;
  label: string;
  subtitle: string;
  image: string;
};

export type Collection = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
};

export type CityOption = {
  city: string;
  province: string;
  transitDays: number;
  fee: number;
};

export const specialListings = {
  "new-arrivals": { eyebrow: "Just In", title: "New Arrivals", subtitle: "Fresh designs. Timeless beauty.", tag: "new" },
  bestsellers: { eyebrow: "Most Loved", title: "Best Sellers", subtitle: "Loved by thousands, for a reason.", tag: "bestseller" },
  gifts: { eyebrow: "For Someone", title: "Gifts", subtitle: "Pieces ready to give, across every budget.", tag: "gift" },
} as const;

export function sizesFor(product: Product, metal: string) {
  const sizes = product.variants.filter((variant) => variant.metal === metal).map((variant) => variant.size);
  return sizes.length > 0 ? sizes : product.sizes;
}
