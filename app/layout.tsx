import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { draftMode } from "next/headers";
import { Aura } from "@/components/aura";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StoreProvider } from "@/components/store";
import { editorialFooter, editorialNavigation, editorialSite } from "@/lib/cms";
import { loadNav } from "@/lib/shop";
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

export async function generateMetadata(): Promise<Metadata> {
  const site = await editorialSite();
  const title = site?.title || "Aura Loom Diamond · Timeless Elegance";
  const description = site?.description || "Aura Loom Diamond — premium gold and diamond jewelry. Free insured delivery across Pakistan, with cash on delivery.";
  return {
    metadataBase: new URL("https://auraloomdimond.com"),
    applicationName: "Aura Loom Diamond",
    title: {
      default: title,
      template: site?.titleTemplate || "%s · Aura Loom Diamond",
    },
    description,
    keywords: ["Aura Loom Diamond", "gold jewelry", "diamond jewelry", "Pakistan", "Karachi", "bridal jewelry"],
    authors: [{ name: "Aura Loom Diamond" }],
    creator: "Aura Loom Diamond",
    publisher: "Aura Loom Diamond",
    openGraph: {
      type: "website",
      locale: "en_PK",
      siteName: "Aura Loom Diamond",
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#090807",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [nav, chrome, footer, draft] = await Promise.all([
    loadNav(),
    editorialNavigation(),
    editorialFooter(),
    draftMode(),
  ]);
  return (
    <html lang="en" className={`${outfit.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <StoreProvider cities={nav.cities}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">
            Skip to content
          </a>
          {draft.isEnabled ? (
            <p className="bg-gold px-4 py-2 text-center text-xs tracking-[0.14em] text-ink uppercase">
              Draft preview. <a href="/api/disable-draft" className="underline">Exit</a>
            </p>
          ) : null}
          <Header categories={nav.categories} collections={nav.collections} chrome={chrome} />
          <main id="main" className="flex-1">{children}</main>
          <Footer content={footer} />
          <Aura />
        </StoreProvider>
      </body>
    </html>
  );
}
