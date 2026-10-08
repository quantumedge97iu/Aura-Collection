import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  LevelFormat,
  PageNumber,
  Header,
  Footer,
} from "docx";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "Aura-Loom-Diamond-Project-Report.docx");

const gold = "8B7355";
const ink = "1A1510";
const mute = "5C5348";
const line = "D4C4A8";
const cream = "FAF6F0";

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: line };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: ink, font: "Calibri", size: 28 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: gold, font: "Calibri", size: 24 })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: "Calibri", size: 22, color: ink, italics: opts.italics })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, font: "Calibri", size: 22, color: ink })],
  });
}

function cell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.header ? { type: "clear", fill: "F0E6D4" } : opts.alt ? { type: "clear", fill: cream } : undefined,
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            font: "Calibri",
            size: opts.header ? 20 : 18,
            bold: !!opts.header || !!opts.bold,
            color: ink,
          }),
        ],
      }),
    ],
  });
}

function twoColTable(rows, widths = [2800, 6560]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((row, i) =>
      new TableRow({
        children: [
          cell(row[0], widths[0], { header: i === 0, bold: i > 0, alt: i % 2 === 0 }),
          cell(row[1], widths[1], { header: i === 0, alt: i % 2 === 0 }),
        ],
      }),
    ),
  });
}

function threeColTable(rows, widths = [2400, 2800, 4160]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((row, i) =>
      new TableRow({
        children: [
          cell(row[0], widths[0], { header: i === 0, bold: i > 0, alt: i % 2 === 0 }),
          cell(row[1], widths[1], { header: i === 0, alt: i % 2 === 0 }),
          cell(row[2], widths[2], { header: i === 0, alt: i % 2 === 0 }),
        ],
      }),
    ),
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [{ id: "Normal", run: { font: "Calibri", size: 22 } }],
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: gold, space: 8 } },
              spacing: { after: 200 },
              children: [
                new TextRun({ text: "Aura Loom Diamond · Project Detail Report", font: "Calibri", size: 18, color: mute }),
                new TextRun({ text: "  |  ", font: "Calibri", size: 18, color: line }),
                new TextRun({ text: "Aura-Collection", font: "Calibri", size: 18, color: gold }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: line, space: 8 } },
              spacing: { before: 120 },
              children: [
                new TextRun({ text: "Prepared jointly · Page ", font: "Calibri", size: 16, color: mute }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: mute }),
                new TextRun({ text: " of ", font: "Calibri", size: 16, color: mute }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 16, color: mute }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Cover
        new Paragraph({ spacing: { before: 1200 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "PROJECT DETAIL REPORT", font: "Calibri", size: 22, color: gold, bold: true, characterSpacing: 200 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Aura Loom Diamond", font: "Georgia", size: 56, bold: true, color: ink })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Timeless Elegance", font: "Georgia", size: 28, italics: true, color: gold })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Premium Jewelry E-Commerce Website", font: "Calibri", size: 24, color: mute })],
        }),
        new Table({
          width: { size: 6000, type: WidthType.DXA },
          columnWidths: [2200, 3800],
          rows: [
            ["Project / Repo", "Aura-Collection"],
            ["Brand", "Aura Loom Diamond"],
            ["Prepared by", "Quantum & Miss Ramisha"],
            ["Nature of work", "Joint collaborative development"],
            ["Stack", "Next.js 16 · React 19 · TypeScript · Tailwind CSS 4"],
            ["Date", "5 October 2026"],
          ].map(
            ([k, v]) =>
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorders,
                    width: { size: 2200, type: WidthType.DXA },
                    children: [
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [new TextRun({ text: k, font: "Calibri", size: 20, bold: true, color: mute })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: noBorders,
                    width: { size: 3800, type: WidthType.DXA },
                    children: [
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [new TextRun({ text: v, font: "Calibri", size: 20, color: ink })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
        new Paragraph({
          spacing: { before: 600 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "This report documents the full website: purpose, features, architecture, pages, data model, and current demo limitations.",
              font: "Calibri",
              size: 20,
              italics: true,
              color: mute,
            }),
          ],
        }),

        // 1
        h1("1. Project Overview"),
        p(
          "Aura Loom Diamond is a Pakistan-focused premium jewelry storefront presented as a modern web application. The brand positions itself as a Karachi house for hallmarked gold and diamond pieces, with free insured delivery and cash on delivery across major cities. The product experience covers browsing, collections, search, wishlist, cart, checkout, order confirmation, shipment tracking, help/FAQs, policies, and a built-in jewelry concierge chatbot named Aura.",
        ),
        p(
          "The codebase lives in the Aura-Collection repository. The site is a full client-side commerce preview: catalog and policies are static TypeScript modules; cart, wishlist, session, and orders persist in the browser via localStorage. There is no live payment gateway, courier API, or server database in the current build.",
        ),
        p(
          "This project was completed jointly by Quantum and Miss Ramisha — design, feature set, storefront flows, and implementation were developed together as a shared deliverable.",
          { italics: true },
        ),

        h1("2. Objectives"),
        bullet("Deliver a luxury-branded e-commerce experience suitable for jewelry retail in Pakistan."),
        bullet("Cover the full shopper journey: discover → product → cart → checkout → track."),
        bullet("Provide trust content: story, reviews, FAQs, shipping/returns/privacy policies, size guide."),
        bullet("Add a guided shopping assistant (Aura) for budget and category recommendations."),
        bullet("Keep the stack modern and maintainable: Next.js App Router, React, TypeScript, Tailwind."),

        h1("3. Technology Stack"),
        twoColTable([
          ["Layer", "Choice"],
          ["Framework", "Next.js 16.3.8 (App Router)"],
          ["UI library", "React 19.2.8 / React DOM 19.2.8"],
          ["Language", "TypeScript 5"],
          ["Styling", "Tailwind CSS 4.3.3 + PostCSS"],
          ["Fonts", "Outfit (sans) · Cormorant Garamond (serif) via next/font"],
          ["State", "React Context + useSyncExternalStore + localStorage"],
          ["Data", "Static modules in lib/ (no database / no API routes)"],
          ["Linting", "ESLint + eslint-config-next"],
          ["Images", "next/image · assets under /public/media"],
        ]),

        h1("4. Brand & Design System"),
        p(
          "Visual direction is dark luxury: near-black ink backgrounds, cream text, and gold accents. Serif display type carries headlines; sans type handles UI chrome and body copy. Uppercase tracked labels reinforce the jewelry-house tone.",
        ),
        twoColTable([
          ["Token", "Value / Role"],
          ["Ink / Panel / Card", "#090807 / #100e0c / #141210 — surfaces"],
          ["Gold / Gold-2", "#c6a36a / #e6d3ae — accents & CTAs"],
          ["Cream / Mute", "#f4efe6 / #a3988c — text hierarchy"],
          ["Line / Blush", "#3a3228 / #e4b2a8 — borders & soft accent"],
          ["Theme color", "#090807 (browser chrome)"],
        ]),

        h1("5. Site Map — Pages & Routes"),
        threeColTable([
          ["Route", "Page", "Purpose"],
          ["/", "Home", "Hero, categories, rails, trust, reviews"],
          ["/shop", "Shop all", "Full catalog listing"],
          ["/shop/[category]", "Category shop", "Rings, bridal, gifts, bestsellers, etc."],
          ["/product/[slug]", "Product detail", "Metal, size, qty, cart, wishlist, related"],
          ["/collections", "Collections", "Curated edits index"],
          ["/collections/[slug]", "Collection", "Bridal, diamond, men’s, gift, gold"],
          ["/cart", "Bag", "Line items, qty, subtotal, checkout"],
          ["/checkout", "Checkout", "Shipping + COD / bank / card"],
          ["/order/[id]", "Order", "Confirmation + simulated timeline"],
          ["/track", "Track", "LJ-/LX- lookup; device order list"],
          ["/wishlist", "Wishlist", "Saved pieces"],
          ["/account", "Account", "Client sign-in + order history"],
          ["/search", "Search", "Catalog text search (?q=)"],
          ["/story", "Our Story", "Brand narrative"],
          ["/help", "Help", "FAQs + contact form"],
          ["/policies/[slug]", "Policies", "Shipping, returns, privacy, terms, care, size"],
        ]),

        h1("6. Feature Details"),
        h2("6.1 Catalog & Merchandising"),
        bullet("13 products with PKR pricing (approx. PKR 26,500 – 185,000)."),
        bullet("10 shop categories: rings, earrings, necklaces, bracelets, bangles, bridal, men, gold, diamonds, gifts."),
        bullet("5 curated collections: Bridal Edit, Diamond House, Men’s Atelier, Gift Edit, Gold Reserve."),
        bullet("Tags for new arrivals, bestsellers, and gifts; related products on PDP."),
        bullet("Catalog filters: metal chips, price bands, sort by featured / price / rating."),

        h2("6.2 Cart, Wishlist & Checkout"),
        bullet("Cart lines store slug, quantity (1–8), selected metal, and size."),
        bullet("Wishlist stores product slugs; header shows badge counts."),
        bullet("Checkout collects name, phone (PK mobile pattern), email, city, address, notes."),
        bullet("Payment methods: Cash on Delivery, Bank Transfer, Debit/Credit Card (demo UI only)."),
        bullet("Free delivery (shippingFee = 0); order IDs generated as LJ-#####."),

        h2("6.3 Order Tracking"),
        bullet("Tracking codes derived as LX-{digits} from the order number."),
        bullet("Timeline steps: placed → confirmed → packed → shipped → out for delivery → delivered."),
        bullet("ETA uses city transit days; bridal / made-to-order adds workshop lead time."),
        bullet("Track page lists recent orders saved on the same device."),

        h2("6.4 Aura — Jewelry Concierge Chatbot"),
        bullet("Floating chat widget (“Ask Aura”) available site-wide from the root layout."),
        bullet("Rule-based matching in lib/assist.ts (category keywords + budget phrases)."),
        bullet("Returns up to three product suggestions with deep links — no external AI API."),
        bullet("Footer “Live Chat” and custom open-aura event open the same panel."),

        h2("6.5 Account, Help & Content"),
        bullet("Account sign-in/register is client-side only; password is validated then discarded."),
        bullet("Help page: FAQs plus contact form (acknowledged on-device; no email backend)."),
        bullet("Newsletter signup acknowledges locally."),
        bullet("Static customer reviews carousel; policy pages for shipping, returns, cancellation, privacy, terms, jewelry care, size guide."),
        bullet("City selector (10 Pakistan cities) affects delivery ETA messaging."),

        h1("7. Architecture & Data Flow"),
        h2("7.1 Folder Structure"),
        bullet("app/ — App Router pages, layout, globals.css, error & not-found."),
        bullet("components/ — UI, header/footer, store, cart/checkout, Aura, catalog views."),
        bullet("lib/ — catalog, content, shipment logic, concierge assist, format helpers."),
        bullet("public/media/ — product and lifestyle imagery."),

        h2("7.2 Client Store (localStorage)"),
        p(
          "All shopper state is persisted under the key luxe-jewels-v1. Snapshot fields: cart, wishlist, orders (max 20), session {name, email}, and selected city. Updates emit a custom luxe-store event and sync across tabs via the storage event. This is why Track and Account say “on this device.”",
        ),

        h2("7.3 Key Modules"),
        threeColTable(
          [
            ["Module", "File", "Responsibility"],
            ["Catalog", "lib/catalog.ts", "Products, categories, collections, search"],
            ["Content", "lib/content.ts", "Cities, reviews, FAQs, policies"],
            ["Shipment", "lib/shipment.ts", "Tracking timeline & ETA"],
            ["Assist", "lib/assist.ts", "Aura concierge rules"],
            ["Store", "components/store.tsx", "Cart, orders, session persistence"],
            ["Aura UI", "components/aura.tsx", "Chat widget"],
          ],
          [1800, 3200, 4360],
        ),

        h1("8. User Journeys"),
        h2("8.1 Purchase"),
        p("Browse home/shop/collection → open product → choose metal/size → add to bag → cart → checkout (shipping + payment) → placeOrder clears cart and saves order → redirect to /order/[id] with confirmation and timeline."),
        h2("8.2 Track"),
        p("Open /track → enter LJ- or LX- number, or pick an order from “On this device” → view simulated shipment steps for the delivery city."),
        h2("8.3 Concierge"),
        p("Open Ask Aura → type need (e.g. “bridal set”, “gold necklace under 50,000”) → receive short reply plus product cards → navigate to PDP."),

        h1("9. Current Limitations (Demo Preview)"),
        bullet("No backend server, database, or REST/API routes."),
        bullet("No real payment processing — card is not charged; bank transfer is instructional only."),
        bullet("Orders, cart, wishlist, and session exist only in browser localStorage."),
        bullet("Shipment progress is time-simulated; no live courier feed."),
        bullet("Contact form and newsletter do not send email."),
        bullet("Account passwords are never stored; auth is not production-grade."),
        bullet("Catalog size is intentionally small (13 SKUs) for the preview."),

        h1("10. How to Run Locally"),
        bullet("Install dependencies: npm install"),
        bullet("Start development server: npm run dev"),
        bullet("Open http://localhost:3000 in the browser"),
        bullet("Production build: npm run build && npm start"),

        h1("11. Collaboration Note"),
        p(
          "This website is a joint deliverable. Quantum and Miss Ramisha worked together on the Aura Loom Diamond / Aura-Collection project — covering product vision, storefront features, UI implementation, and the overall shopping experience documented in this report.",
        ),
        p(
          "Suggested shared credit line: “Developed collaboratively by Quantum and Miss Ramisha.”",
          { italics: true },
        ),

        h1("12. Summary"),
        p(
          "Aura Loom Diamond is a complete luxury jewelry e-commerce front end for the Pakistan market: branded dark-gold UI, full browse-to-checkout flow, device-local orders, city-aware tracking simulation, policy/help content, and the Aura concierge. It is ready as a demo/portfolio storefront and can later connect to real payments, inventory, auth, and courier APIs without changing the core shopper journey.",
        ),

        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 12, color: gold, space: 12 } },
          spacing: { before: 200 },
          children: [new TextRun({ text: "— End of Report —", font: "Calibri", size: 20, color: mute, italics: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80 },
          children: [
            new TextRun({
              text: "Aura Loom Diamond · Aura-Collection · Quantum & Miss Ramisha · October 2026",
              font: "Calibri",
              size: 18,
              color: gold,
            }),
          ],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(outPath, buffer);
console.log("Wrote", outPath);
