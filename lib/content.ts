export const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
];

export const reviews = [
  {
    name: "Ayesha Khan",
    city: "Lahore",
    rating: 5,
    quote: "Absolutely stunning quality! The ring is even more beautiful in person. Highly recommended!",
  },
  {
    name: "Fatima Rizwan",
    city: "Karachi",
    rating: 5,
    quote: "Fast delivery and amazing customer service. The necklace is perfect.",
  },
  {
    name: "Usman Ali",
    city: "Islamabad",
    rating: 5,
    quote: "Great experience. Authentic products and smooth payment process.",
  },
  {
    name: "Hira Shah",
    city: "Multan",
    rating: 4,
    quote: "The bangle set arrived boxed and hallmarked. I sized up once and the exchange was simple.",
  },
];

export const faqs = [
  {
    q: "How long does delivery take?",
    a: "Orders placed before 3pm ship the same day from Karachi. Most cities receive them in 2 to 4 working days. Bridal pieces made to order can take up to 10 days.",
  },
  {
    q: "Do you take cash on delivery?",
    a: "Yes. Cash on delivery is available across Pakistan. You can also pay by bank transfer or card at checkout. Card payments on this preview are not charged.",
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
    a: "Open Track Order and enter the order number (LJ-) or the tracking number (LX-). The timeline moves with the house schedule for your city. Orders stay on this device until a courier feed is connected.",
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
          "Orders can be cancelled before they are packed. Cash on delivery orders are released with one message. Prepaid orders are reversed to the same method.",
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
          "This storefront keeps your bag, wishlist, and orders in local storage on your device. Nothing is sent to a server yet.",
          "When the backend is connected, we will store only what an order needs: name, phone, address, and payment reference. Card numbers will be handled by the payment provider, not by Aura Loom Diamond.",
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
          "Prices are in Pakistani rupees and include insured delivery. Title passes when the parcel is delivered, or when a cash on delivery payment is collected.",
          "The checkout on this preview confirms an order on your device. It does not charge a card or move money.",
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
