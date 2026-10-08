import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "Aura-Loom-Diamond-CEO-Briefing.pdf");

const ink = "#1A1510";
const gold = "#8B7355";
const mute = "#5C5348";
const soft = "#F5EFE6";
const line = "#D4C4A8";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 56, bottom: 64, left: 56, right: 56 },
  bufferPages: true,
  info: {
    Title: "Aura Loom Diamond — CEO Project Briefing",
    Author: "Miss Ramisha & Miss Kiran",
    Subject: "Frontend delivery status, backend roadmap, and stock plan",
  },
});

const stream = createWriteStream(outPath);
doc.pipe(stream);

function hr() {
  const y = doc.y;
  doc
    .strokeColor(line)
    .lineWidth(1)
    .moveTo(56, y)
    .lineTo(539, y)
    .stroke();
  doc.moveDown(0.8);
}

function section(title) {
  doc.moveDown(0.6);
  doc.fillColor(gold).font("Helvetica-Bold").fontSize(12).text(title.toUpperCase());
  doc.moveDown(0.25);
  doc
    .strokeColor(gold)
    .lineWidth(1.5)
    .moveTo(56, doc.y)
    .lineTo(160, doc.y)
    .stroke();
  doc.moveDown(0.55);
  doc.fillColor(ink);
}

function body(text) {
  doc.fillColor(ink).font("Helvetica").fontSize(10.5).text(text, { align: "justify", lineGap: 2.5 });
  doc.moveDown(0.45);
}

function bullet(text) {
  const x = 68;
  const bulletX = 56;
  const startY = doc.y;
  doc.fillColor(gold).font("Helvetica").fontSize(10.5).text("•", bulletX, startY, { width: 12 });
  doc.fillColor(ink).font("Helvetica").fontSize(10.5).text(text, x, startY, {
    width: 471,
    align: "left",
    lineGap: 2,
  });
  doc.moveDown(0.28);
}

// Header bar
doc.rect(0, 0, 595, 92).fill(ink);
doc.fillColor(gold).font("Helvetica").fontSize(9).text("CONFIDENTIAL · INTERNAL BRIEFING", 56, 22, { characterSpacing: 1.5 });
doc.fillColor("#F4EFE6").font("Helvetica-Bold").fontSize(22).text("Aura Loom Diamond", 56, 40);
doc.fillColor(line).font("Helvetica").fontSize(11).text("Website Delivery Briefing for CEO", 56, 68);

doc.y = 112;

doc.fillColor(mute).font("Helvetica").fontSize(9.5);
doc.text("To: Chief Executive Officer", { continued: false });
doc.text("From: Miss Ramisha & Miss Kiran");
doc.text("Project: Aura-Collection / Aura Loom Diamond E-Commerce Website");
doc.text(`Date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
doc.moveDown(0.5);
hr();

section("1. Purpose of this note");
body(
  "This briefing summarizes the current status of the Aura Loom Diamond website. Miss Ramisha and Miss Kiran have completed the full frontend of the website. Remaining backend work and live product stock updates are planned next, and these points have already been noted in Nau Dairy for follow-up.",
);

section("2. Who built the website");
body(
  "The complete frontend of the Aura Loom Diamond website has been designed and developed by Miss Ramisha and Miss Kiran. They jointly delivered the customer-facing storefront — pages, shopping flows, visual design, and interactive features — as a working website ready for review.",
);
bullet("Miss Ramisha — frontend development (joint delivery)");
bullet("Miss Kiran — frontend development (joint delivery)");
bullet("Scope delivered: full website frontend for Aura Loom Diamond (Aura-Collection)");

section("3. What is live on the frontend today");
body(
  "The frontend is a premium jewelry e-commerce experience branded as Aura Loom Diamond — Timeless Elegance. It covers the full shopper journey on the customer side:",
);
bullet("Home, shop by category, curated collections, and product detail pages");
bullet("Search, wishlist, cart, and checkout (Cash on Delivery / bank / card UI)");
bullet("Order confirmation and shipment tracking screens");
bullet("Account area, help/FAQs, contact form, and policy pages");
bullet("Brand story, reviews, newsletter signup, and city-based delivery messaging");
bullet("Ask Aura — jewelry concierge chatbot for guided product suggestions");
bullet("Pakistan-focused presentation: PKR pricing, COD, free insured delivery messaging");

doc.moveDown(0.2);
body(
  "Tech used for the frontend: Next.js, React, TypeScript, and Tailwind CSS, with a dark luxury gold visual system suitable for a jewelry house.",
);

section("4. Backend work still required");
body(
  "The frontend is complete for review and demonstration. Backend work is still required going forward so the website can operate as a full production system. Miss Ramisha and Miss Kiran will continue on the backend as the next phase.",
);
bullet("Server / API layer for real orders, customers, and catalog operations");
bullet("Secure authentication and account management");
bullet("Payment gateway integration (beyond the current preview checkout UI)");
bullet("Live courier / tracking connection (current tracking is simulated on-device)");
bullet("Email / notifications for order confirmation and support");
bullet("Admin tools to manage stock, prices, and product media");
bullet("Database in place of browser-only (localStorage) cart and order storage");

doc.moveDown(0.15);
body(
  "Until the backend is connected, cart, wishlist, session, and orders remain on the customer’s device only. This is expected for the current frontend preview stage.",
);

section("5. Noted in Nau Dairy");
body(
  "The following points have been recorded in Nau Dairy so the team has a clear written follow-up list:",
);
bullet("Frontend website — completed by Miss Ramisha and Miss Kiran");
bullet("Backend development — required next; work to continue on APIs, payments, auth, and live data");
bullet("Original / real products — to be added on the website when stock arrives");
bullet("Current catalog items are for storefront preview until original stock is available");

section("6. Original products & stock plan");
body(
  "When original products arrive in stock, they will be added to the website catalog. Until then, the site uses preview product listings so the CEO and team can review design, navigation, checkout flow, tracking screens, and the Aura concierge experience.",
);
bullet("Preview catalog is already structured by category (rings, earrings, bridal, gold, diamonds, etc.)");
bullet("On stock arrival: add original product names, prices, images, SKUs, and availability");
bullet("Backend/admin product management will make ongoing stock updates faster and safer");

section("7. Recommendation / next steps");
bullet("CEO review of the completed frontend (localhost or staging URL)");
bullet("Approve backend phase priorities (orders, payments, stock admin first)");
bullet("Confirm when original stock will be ready for product upload");
bullet("Continue tracking all follow-ups in Nau Dairy");

doc.moveDown(0.4);
hr();

doc.fillColor(ink).font("Helvetica-Bold").fontSize(10.5).text("Closing");
doc.moveDown(0.3);
body(
  "In short: Miss Ramisha and Miss Kiran have built the full Aura Loom Diamond website frontend. Backend work remains ahead, these commitments are noted in Nau Dairy, and original products will be added when stock arrives. We are ready for CEO guidance on backend priorities and stock timing.",
);

doc.moveDown(0.3);
doc.fillColor(mute).font("Helvetica").fontSize(9.5);
doc.text("Prepared for CEO review");
doc.text("Miss Ramisha & Miss Kiran");
doc.text("Aura Loom Diamond · Aura-Collection");

const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fillColor(mute).font("Helvetica").fontSize(8);
  doc.text(
    "Aura Loom Diamond · CEO Briefing · Miss Ramisha & Miss Kiran · Nau Dairy follow-up",
    56,
    810,
    { width: 400, align: "left", lineBreak: false },
  );
  doc.text(`Page ${i - range.start + 1} of ${range.count}`, 456, 810, {
    width: 84,
    align: "right",
    lineBreak: false,
  });
}

doc.end();

await new Promise((resolve, reject) => {
  stream.on("finish", resolve);
  stream.on("error", reject);
});

console.log("Wrote", outPath);
