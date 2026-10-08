export type CategorySlug =
  | "rings"
  | "earrings"
  | "necklaces"
  | "bracelets"
  | "bangles"
  | "bridal"
  | "men"
  | "gold"
  | "diamonds";

export type Tag = "new" | "bestseller" | "gift";

export type Product = {
  slug: string;
  name: string;
  price: number;
  category: CategorySlug;
  appearsIn?: CategorySlug[];
  image: string;
  tags: Tag[];
  metals: string[];
  sizes: string[];
  sku: string;
  rating: number;
  reviewCount: number;
  description: string;
  details: string[];
};

export type Category = {
  slug: string;
  label: string;
  image: string;
  subtitle: string;
};

export const categories: Category[] = [
  { slug: "rings", label: "Rings", image: "/media/ring-royal.jpg", subtitle: "Solitaires, halos, and bands finished for every day." },
  { slug: "earrings", label: "Earrings", image: "/media/earrings-drops.jpg", subtitle: "Drops, studs, and pearls with a quiet shine." },
  { slug: "necklaces", label: "Necklaces", image: "/media/necklace-pendant.jpg", subtitle: "Pendants and chains that sit close to the collarbone." },
  { slug: "bracelets", label: "Bracelets", image: "/media/bracelet-diamond.jpg", subtitle: "Tennis lines and fine gold cuffs." },
  { slug: "bangles", label: "Bangles", image: "/media/bangles-gold.jpg", subtitle: "Stacked gold, made to be worn together." },
  { slug: "bridal", label: "Bridal", image: "/media/bridal-choker.jpg", subtitle: "Ceremony sets for the vows and the celebrations after." },
  { slug: "men", label: "Men", image: "/media/ring-signet.jpg", subtitle: "Signets and chains with a heavier hand." },
  { slug: "gold", label: "Gold", image: "/media/gold-bars.jpg", subtitle: "Hallmarked gold, from wearable pieces to reserve bars." },
  { slug: "diamonds", label: "Diamonds", image: "/media/diamond-stud.jpg", subtitle: "Stones chosen for cut, then set in gold." },
  { slug: "gifts", label: "Gifts", image: "/media/earrings-pearl.jpg", subtitle: "Pieces ready to give, across every budget." },
];

const golds = ["Yellow Gold", "Rose Gold", "White Gold"];
const ringSizes = ["12", "14", "16", "18", "20"];

export const products: Product[] = [
  {
    slug: "royal-sparkle-ring",
    name: "Royal Sparkle Ring",
    price: 48500,
    category: "rings",
    appearsIn: ["diamonds"],
    image: "/media/ring-royal.jpg",
    tags: ["new"],
    metals: golds,
    sizes: ringSizes,
    sku: "LJ-RG-048",
    rating: 4.9,
    reviewCount: 128,
    description: "A diamond halo around a brilliant center, on a fine gold band. Made for proposals, anniversaries, and days with no occasion at all.",
    details: ["Brilliant center with a pavé halo", "Polished gold band", "Hallmarked metal", "Arrives in a Luxe Jewels box"],
  },
  {
    slug: "golden-drops-earrings",
    name: "Golden Drops Earrings",
    price: 32000,
    category: "earrings",
    appearsIn: ["bridal"],
    image: "/media/earrings-drops.jpg",
    tags: ["new", "gift"],
    metals: golds,
    sizes: ["One size"],
    sku: "LJ-ER-032",
    rating: 4.8,
    reviewCount: 86,
    description: "Chandelier drops in yellow gold, set with stones that catch light when you turn. Light enough for a long evening.",
    details: ["Pierced ears", "Secure butterfly back", "Hallmarked gold", "Gift boxed"],
  },
  {
    slug: "eternal-grace-necklace",
    name: "Eternal Grace Necklace",
    price: 78000,
    category: "necklaces",
    appearsIn: ["bridal"],
    image: "/media/necklace-pendant.jpg",
    tags: ["new"],
    metals: golds,
    sizes: ['16"', '18"', '20"'],
    sku: "LJ-NK-078",
    rating: 5,
    reviewCount: 64,
    description: "A teardrop pendant on a fine gold chain. It sits at the collarbone and works alone or over a neckline.",
    details: ["Adjustable length", "Diamond teardrop pendant", "Hallmarked gold", "Lobster clasp"],
  },
  {
    slug: "diamond-cut-bracelet",
    name: "Diamond Cut Bracelet",
    price: 41500,
    category: "bracelets",
    appearsIn: ["diamonds"],
    image: "/media/bracelet-diamond.jpg",
    tags: ["new", "gift"],
    metals: golds,
    sizes: ['6.5"', '7"', '7.5"'],
    sku: "LJ-BR-041",
    rating: 4.7,
    reviewCount: 54,
    description: "A continuous line of round diamonds in gold. Worn alone, it reads as one clean streak of light.",
    details: ["Tennis setting", "Box clasp with safety latch", "Hallmarked gold", "Gift boxed"],
  },
  {
    slug: "classic-solitaire-ring",
    name: "Classic Solitaire Ring",
    price: 65000,
    category: "rings",
    appearsIn: ["diamonds"],
    image: "/media/ring-solitaire.jpg",
    tags: ["bestseller"],
    metals: golds,
    sizes: ringSizes,
    sku: "LJ-RG-065",
    rating: 4.9,
    reviewCount: 210,
    description: "One stone, four prongs, a plain gold shank. The house solitaire, kept deliberately quiet.",
    details: ["Four-prong setting", "Comfort-fit band", "Hallmarked gold", "Sizing available within 7 days"],
  },
  {
    slug: "pearl-drop-earrings",
    name: "Pearl Drop Earrings",
    price: 26500,
    category: "earrings",
    image: "/media/earrings-pearl.jpg",
    tags: ["bestseller", "gift"],
    metals: ["Yellow Gold", "White Gold"],
    sizes: ["One size"],
    sku: "LJ-ER-026",
    rating: 4.8,
    reviewCount: 173,
    description: "A single pearl suspended from a small diamond cap. The pair most often chosen as a first fine gift.",
    details: ["Freshwater pearl drops", "Diamond cap", "Hallmarked gold", "Gift boxed"],
  },
  {
    slug: "floral-pendant-necklace",
    name: "Floral Pendant Necklace",
    price: 52000,
    category: "necklaces",
    image: "/media/necklace-floral.jpg",
    tags: ["bestseller", "gift"],
    metals: golds,
    sizes: ['16"', '18"', '20"'],
    sku: "LJ-NK-052",
    rating: 4.8,
    reviewCount: 141,
    description: "A small gold flower, pavé set, on a chain you can sleep in. Designed to be the piece that never comes off.",
    details: ["Floral pavé pendant", "Fine cable chain", "Hallmarked gold", "Extendable clasp"],
  },
  {
    slug: "gold-bangle-set",
    name: "Gold Bangle Set",
    price: 72000,
    category: "bangles",
    appearsIn: ["bridal", "gold"],
    image: "/media/bangles-gold.jpg",
    tags: ["bestseller"],
    metals: ["Yellow Gold", "Rose Gold"],
    sizes: ["2.4", "2.6", "2.8"],
    sku: "LJ-BG-072",
    rating: 4.9,
    reviewCount: 98,
    description: "Three polished bangles, one with a diamond row. Sold as a set, meant to be stacked.",
    details: ["Set of three", "Diamond row on the center bangle", "Hallmarked gold", "Hinge opening on the diamond bangle"],
  },
  {
    slug: "noor-bridal-choker",
    name: "Noor Bridal Choker",
    price: 145000,
    category: "bridal",
    image: "/media/bridal-choker.jpg",
    tags: [],
    metals: ["Yellow Gold", "Rose Gold"],
    sizes: ["One size"],
    sku: "LJ-BD-145",
    rating: 5,
    reviewCount: 37,
    description: "An ornate gold choker for the ceremony. Stones and pearls sit close to the throat, with enough presence for a bare neckline.",
    details: ["Choker length", "Stone and pearl setting", "Hallmarked gold", "Made to order in 10 days if resizing is needed"],
  },
  {
    slug: "heritage-signet-ring",
    name: "Heritage Signet Ring",
    price: 38000,
    category: "men",
    appearsIn: ["rings"],
    image: "/media/ring-signet.jpg",
    tags: [],
    metals: ["Yellow Gold", "Rose Gold"],
    sizes: ["16", "18", "20", "22", "24"],
    sku: "LJ-MN-038",
    rating: 4.7,
    reviewCount: 72,
    description: "A heavy signet with a smooth oval face. The face is left plain so it can be engraved after purchase.",
    details: ["Solid gold face", "Engraving available on request", "Hallmarked gold", "Wider comfort band"],
  },
  {
    slug: "aurum-gold-bar",
    name: "Aurum 24K Gold Bar",
    price: 185000,
    category: "gold",
    image: "/media/gold-bars.jpg",
    tags: [],
    metals: ["24K"],
    sizes: ["5g"],
    sku: "LJ-GB-185",
    rating: 5,
    reviewCount: 29,
    description: "A 5 gram 24K bar from the house reserve. Insured delivery, sealed, with the assay card in the box.",
    details: ["5 grams", "24 karat", "Sealed with assay card", "Insured nationwide delivery"],
  },
  {
    slug: "lumiere-diamond-studs",
    name: "Lumière Diamond Studs",
    price: 96000,
    category: "diamonds",
    appearsIn: ["earrings"],
    image: "/media/diamond-stud.jpg",
    tags: ["gift"],
    metals: ["White Gold", "Yellow Gold"],
    sizes: ["One size"],
    sku: "LJ-DM-096",
    rating: 4.9,
    reviewCount: 81,
    description: "A matched pair of round brilliants in a low four-prong setting. The stud that replaces every other pair.",
    details: ["Matched round brilliants", "Low prong setting", "Hallmarked gold", "Screw or push backing on request"],
  },
  {
    slug: "sovereign-gold-chain",
    name: "Sovereign Gold Chain",
    price: 61000,
    category: "men",
    appearsIn: ["necklaces", "gold"],
    image: "/media/chain-men.jpg",
    tags: [],
    metals: ["Yellow Gold"],
    sizes: ['20"', '22"', '24"'],
    sku: "LJ-MN-061",
    rating: 4.8,
    reviewCount: 66,
    description: "A curb chain with weight you can feel. Polished, not plated, and finished with a solid lobster clasp.",
    details: ["Curb links", "Yellow gold", "Hallmarked", "Solid lobster clasp"],
  },
];

export const collections = [
  {
    slug: "bridal-edit",
    title: "Bridal Edit",
    subtitle: "Chokers, drops, and stacks for the wedding week.",
    image: "/media/bridal-choker.jpg",
    productSlugs: ["noor-bridal-choker", "eternal-grace-necklace", "golden-drops-earrings", "gold-bangle-set"],
  },
  {
    slug: "diamond-house",
    title: "Diamond House",
    subtitle: "Solitaires, studs, and lines of white light.",
    image: "/media/diamond-stud.jpg",
    productSlugs: ["classic-solitaire-ring", "lumiere-diamond-studs", "diamond-cut-bracelet", "royal-sparkle-ring"],
  },
  {
    slug: "mens-atelier",
    title: "Men's Atelier",
    subtitle: "Signets and chains with a heavier hand.",
    image: "/media/chain-men.jpg",
    productSlugs: ["heritage-signet-ring", "sovereign-gold-chain", "aurum-gold-bar"],
  },
  {
    slug: "gift-edit",
    title: "The Gift Edit",
    subtitle: "Boxed and ready, from pearls to a full diamond stud.",
    image: "/media/earrings-pearl.jpg",
    productSlugs: ["pearl-drop-earrings", "floral-pendant-necklace", "golden-drops-earrings", "lumiere-diamond-studs"],
  },
  {
    slug: "gold-reserve",
    title: "Gold Reserve",
    subtitle: "Wearable gold and a sealed 24K bar.",
    image: "/media/gold-bars.jpg",
    productSlugs: ["aurum-gold-bar", "gold-bangle-set", "sovereign-gold-chain", "heritage-signet-ring"],
  },
] as const;

export type Listing = {
  eyebrow: string;
  title: string;
  subtitle: string;
  products: Product[];
};

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function inCategory(product: Product, slug: string) {
  return product.category === slug || product.appearsIn?.includes(slug as CategorySlug);
}

export function getListing(slug?: string): Listing | null {
  if (!slug) {
    return {
      eyebrow: "The House",
      title: "Shop All",
      subtitle: "Gold, diamonds, and pieces made to be worn for years.",
      products,
    };
  }

  if (slug === "new-arrivals") {
    return {
      eyebrow: "Just In",
      title: "New Arrivals",
      subtitle: "Fresh designs. Timeless elegance.",
      products: products.filter((product) => product.tags.includes("new")),
    };
  }

  if (slug === "bestsellers") {
    return {
      eyebrow: "Most Loved",
      title: "Best Sellers",
      subtitle: "Loved by thousands, for a reason.",
      products: products.filter((product) => product.tags.includes("bestseller")),
    };
  }

  if (slug === "gifts") {
    return {
      eyebrow: "For Someone",
      title: "Gifts",
      subtitle: "Pieces ready to give, across every budget.",
      products: products.filter((product) => product.tags.includes("gift")),
    };
  }

  const category = categories.find((item) => item.slug === slug);
  if (!category || slug === "gifts") return null;

  return {
    eyebrow: "Category",
    title: category.label,
    subtitle: category.subtitle,
    products: products.filter((product) => inCategory(product, slug)),
  };
}

export function listingSlugs() {
  return [...categories.map((category) => category.slug), "new-arrivals", "bestsellers"];
}

export function getCollection(slug: string) {
  const collection = collections.find((item) => item.slug === slug);
  if (!collection) return null;
  return {
    ...collection,
    products: collection.productSlugs
      .map((productSlug) => getProduct(productSlug))
      .filter((product): product is Product => Boolean(product)),
  };
}

export function relatedProducts(slug: string) {
  const product = getProduct(slug);
  if (!product) return [];
  const same = products.filter((item) => item.slug !== slug && item.category === product.category);
  const rest = products.filter((item) => item.slug !== slug && item.category !== product.category);
  return [...same, ...rest].slice(0, 4);
}

export function searchProducts(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return products.filter((product) => {
    const haystack = [
      product.name,
      product.category,
      product.description,
      product.sku,
      ...product.tags,
      ...product.metals,
      ...(product.appearsIn ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function categoryLabel(slug: string) {
  return categories.find((category) => category.slug === slug)?.label ?? slug;
}
