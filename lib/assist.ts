import type { Product } from "@/lib/catalog";
import { pkr } from "@/lib/format";

const tests: Array<[RegExp, (product: Product) => boolean]> = [
  [/ring/, (product) => product.category === "rings" || product.appearsIn.includes("rings")],
  [/earring|jhumka|stud/, (product) => product.category === "earrings" || product.appearsIn.includes("earrings")],
  [/necklace|pendant|chain|haar/, (product) => product.category === "necklaces" || product.appearsIn.includes("necklaces")],
  [/bracelet/, (product) => product.category === "bracelets"],
  [/bangle/, (product) => product.category === "bangles"],
  [/bridal|wedding|dulhan/, (product) => product.category === "bridal" || product.appearsIn.includes("bridal")],
  [/\bmen\b|\bman\b|\bhim\b|husband|signet/, (product) => product.category === "men"],
  [/diamond/, (product) => product.category === "diamonds" || product.appearsIn.includes("diamonds")],
  [/bar|bullion|24k/, (product) => product.category === "gold" && product.slug.includes("bar")],
  [/gift|present/, (product) => product.tags.includes("gift")],
];

export function concierge(message: string, products: Product[]) {
  const query = message.toLowerCase();
  let list = products.slice();

  const budget = query.match(/(?:under|below|less than|within|max)\s*(?:rs\.?|pkr|rupees)?\s*([\d][\d,]*)/);
  const amount = budget ? Number(budget[1].replace(/,/g, "")) : 0;
  if (amount > 0) list = list.filter((product) => product.price <= amount);

  const matched = tests.filter(([pattern]) => pattern.test(query));
  const applyMatch = (source: Product[]) => {
    if (matched.length > 0) return source.filter((product) => matched.some(([, test]) => test(product)));
    if (/\bgold\b/.test(query)) return source.filter((product) => product.metals.some((metal) => metal.toLowerCase().includes("gold")) || product.category === "gold");
    return source;
  };

  const narrowed = applyMatch(list);
  if (narrowed.length > 0) {
    const picks = narrowed.slice(0, 3);
    return {
      reply: picks.length === 1 ? "This is the piece I would put in front of you." : `I pulled ${picks.length} pieces from the house. Open any of them for metal, size, and delivery.`,
      products: picks,
    };
  }

  if (amount > 0) {
    const closest = [...applyMatch(products)].sort((a, b) => a.price - b.price).slice(0, 3);
    if (closest.length > 0) {
      return {
        reply: `Nothing in the house is under ${pkr(amount)}. These are the closest.`,
        products: closest,
      };
    }
  }

  return {
    reply: products.length === 0 ? "The collection is not reachable right now. Try again in a moment." : "Nothing in the house matches that exactly. Try rings, a bridal set, or a budget such as under 50,000.",
    products: [] as Product[],
  };
}
