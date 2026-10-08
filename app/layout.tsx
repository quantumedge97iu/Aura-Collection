import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { Aura } from "@/components/aura";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StoreProvider } from "@/components/store";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  applicationName: "Aura Loom Diamond",
  title: {
    default: "Aura Loom Diamond · Timeless Elegance",
    template: "%s · Aura Loom Diamond",
  },
  description:
    "Aura Loom Diamond — premium gold and diamond jewelry. Free insured delivery across Pakistan, with cash on delivery.",
  keywords: ["Aura Loom Diamond", "gold jewelry", "diamond jewelry", "Pakistan", "Karachi", "bridal jewelry"],
  authors: [{ name: "Aura Loom Diamond" }],
  creator: "Aura Loom Diamond",
  publisher: "Aura Loom Diamond",
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "Aura Loom Diamond",
    title: "Aura Loom Diamond · Timeless Elegance",
    description:
      "Aura Loom Diamond — premium gold and diamond jewelry. Free insured delivery across Pakistan, with cash on delivery.",
  },
  twitter: {
    card: "summary",
    title: "Aura Loom Diamond · Timeless Elegance",
    description:
      "Aura Loom Diamond — premium gold and diamond jewelry. Free insured delivery across Pakistan, with cash on delivery.",
  },
};

export const viewport: Viewport = {
  themeColor: "#090807",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <StoreProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
          <Aura />
        </StoreProvider>
      </body>
    </html>
  );
}
