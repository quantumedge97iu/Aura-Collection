export const faqs = [
  {
    q: "How long does delivery take?",
    a: "Orders placed before 3pm ship the same day from Karachi. Most cities receive them in 2 to 4 working days. Bridal pieces made to order can take up to 10 days.",
  },
  {
    q: "Do you take cash on delivery?",
    a: "Yes. Cash on delivery is available across Pakistan. You can also pay by bank transfer or card at checkout. A card payment stays pending until the house records it.",
  },
  {
    q: "How do returns work?",
    a: "Unworn pieces can come back within 7 days in the original box, with the hallmarks intact. Earrings with pierced backs and engraved signets are final if the seal is open.",
  },
  {
    q: "Is the gold hallmarked?",
    a: "Every gold piece leaves with a hallmark and the house card. The 24K bar ships sealed with its assay card.",
  },
  {
    q: "Can I track an order?",
    a: "Open Track Order and enter the order number with the email used at checkout. The timeline follows the status stored with the order.",
  },
  {
    q: "Do you resize rings?",
    a: "Rings can be exchanged for another size within 7 days if they are unworn. The size guide lists the house sizes from 12 to 24.",
  },
];

export type Policy = {
  title: string;
  eyebrow: string;
  blocks: Array<{
    heading?: string;
    paragraphs?: string[];
    list?: string[];
    table?: { headers: string[]; rows: string[][] };
  }>;
};

export const policies: Record<string, Policy> = {
  shipping: {
    title: "Shipping Policy",
    eyebrow: "Delivery",
    blocks: [
      {
        paragraphs: [
          "Delivery is free across Pakistan. Every parcel is insured from the moment it leaves the studio until it is signed for.",
          "Karachi orders placed before 3pm leave the same day. Other cities typically arrive in 2 to 4 working days.",
        ],
      },
      {
        heading: "What ships with the piece",
        list: ["Hallmark or assay card", "Aura Loom Diamond box", "Care card and invoice", "A tamper seal"],
      },
    ],
  },
  returns: {
    title: "Return & Exchange",
    eyebrow: "Aftercare",
    blocks: [
      {
        paragraphs: [
          "You have 7 days from delivery to return or exchange an unworn piece. Write to fatahfizza07@gmail.com or start from your order number and we will arrange pickup.",
        ],
      },
      {
        heading: "Eligible",
        list: ["Unworn, with the seal intact", "Original box and card included", "Hallmark still readable"],
      },
      {
        heading: "Not eligible",
        list: ["Engraved signets", "Opened earring backs", "24K bars with a broken seal"],
      },
    ],
  },
  cancellation: {
    title: "Cancellation Policy",
    eyebrow: "Orders",
    blocks: [
      {
        paragraphs: [
          "Orders can be cancelled before they are packed, while the status is still created or confirmed and payment is pending or failed. Cash on delivery reservations are released. Prepaid orders are reversed to the same method.",
          "Bridal pieces already in production can be cancelled within 24 hours of placing the order.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Information",
    blocks: [
      {
        paragraphs: [
          "Orders, addresses, and payments are stored in the shop database. Passwords stay with Supabase Auth and are not written into the shop tables.",
          "A card checkout keeps only the last four digits. The payment stays pending until Aura Loom Diamond records it. Card numbers are not stored here.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    eyebrow: "Information",
    blocks: [
      {
        paragraphs: [
          "Pieces are described by metal, size, and finish. Photographs are of the house collection and can vary slightly in stone placement.",
          "Prices are in Pakistani rupees. The amount due is the total stored with the order. Title passes when the parcel is delivered, or when a cash on delivery payment is collected.",
        ],
      },
    ],
  },
  "jewelry-care": {
    title: "Jewelry Care",
    eyebrow: "At Home",
    blocks: [
      {
        paragraphs: ["Gold likes to be worn. It does not like perfume, chlorine, or a shared box with harder stones."],
        list: [
          "Put jewelry on after perfume and hairspray.",
          "Wipe gold with a soft cloth. Skip toothpaste and baking soda.",
          "Store chains flat so they do not knot.",
          "Pearls stay in their pouch, away from other metals.",
          "Have prongs checked once a year.",
        ],
      },
    ],
  },
  "size-guide": {
    title: "Size Guide",
    eyebrow: "Fit",
    blocks: [
      {
        paragraphs: [
          "Ring size is the inner circumference. If you are between two sizes, take the larger one. Bangle size is the inner diameter in inches.",
        ],
        table: {
          headers: ["Ring size", "Circumference"],
          rows: [
            ["12", "51 mm"],
            ["14", "54 mm"],
            ["16", "57 mm"],
            ["18", "60 mm"],
            ["20", "63 mm"],
            ["22", "66 mm"],
            ["24", "69 mm"],
          ],
        },
      },
      {
        heading: "Bangles",
        paragraphs: ["2.4 suits a small wrist, 2.6 is the house standard, and 2.8 is a wider fit. Measure the widest point of the hand, not the wrist."],
      },
    ],
  },
};

export function policySlugs() {
  return Object.keys(policies);
}
