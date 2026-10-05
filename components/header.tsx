"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useClientReady, useStore } from "@/components/store";
import { Container, Logo } from "@/components/ui";
import { categories, collections, searchProducts } from "@/lib/catalog";
import { cities } from "@/lib/content";
import { cn } from "@/lib/format";

const links = [
  { href: "/shop", label: "Shop", menu: "shop" as const },
  { href: "/collections", label: "Collections", menu: "collections" as const },
  { href: "/shop/new-arrivals", label: "New Arrivals" },
  { href: "/shop/bridal", label: "Bridal" },
  { href: "/shop/men", label: "Men" },
  { href: "/shop/gifts", label: "Gifts" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, wishlist, city, setDeliverTo } = useStore();
  const ready = useClientReady();
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<"shop" | "collections" | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activePath, setActivePath] = useState(pathname);
  const suggestions = query.trim().length > 1 ? searchProducts(query).slice(0, 5) : [];

  if (activePath !== pathname) {
    setActivePath(pathname);
    setMenu(false);
    setOpen(null);
    setSearchOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const next = query.trim();
    if (!next) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-ink/95 backdrop-blur">
      <div className="hidden border-b border-white/5 text-[11px] text-mute sm:block">
        <Container className="flex h-9 items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-6">
            <span className="inline-flex items-center gap-1.5"><Icon name="truck" className="h-3.5 w-3.5 text-gold" /> Free Delivery Across Pakistan</span>
            <span className="hidden items-center gap-1.5 md:inline-flex"><Icon name="card" className="h-3.5 w-3.5 text-gold" /> Cash on Delivery Available</span>
            <span className="hidden items-center gap-1.5 lg:inline-flex"><Icon name="shield" className="h-3.5 w-3.5 text-gold" /> Secure & Trusted Payments</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <Icon name="pin" className="h-3.5 w-3.5 text-gold" />
              <span>Deliver to</span>
              <select aria-label="Delivery city" value={city} onChange={(event) => setDeliverTo(event.target.value)} className="bg-transparent text-cream outline-none">
                {cities.map((item) => <option key={item} className="bg-ink text-cream">{item}</option>)}
              </select>
            </label>
            <Link href="/track" className="hover:text-gold">Track Order</Link>
            <Link href="/help" className="hover:text-gold">Help</Link>
            <a href="tel:+923001234567" className="hidden items-center gap-1.5 text-gold xl:inline-flex">
              <Icon name="phone" className="h-3.5 w-3.5" /> +92 300 1234567
            </a>
          </div>
        </Container>
      </div>

      <Container className="flex h-[72px] items-center gap-3 lg:gap-8">
        <button type="button" className="grid h-10 w-10 place-items-center text-gold lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}>
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <Logo />

        <nav className="ml-4 hidden items-center gap-5 xl:gap-6 lg:flex">
          {links.map((link) => (
            <div key={link.href} className="relative" onMouseLeave={() => link.menu && setOpen(null)}>
              {link.menu ? (
                <button
                  type="button"
                  className={cn("inline-flex items-center gap-1 text-[13px] text-cream/90 hover:text-gold", pathname.startsWith(link.href) && "text-gold")}
                  aria-expanded={open === link.menu}
                  onMouseEnter={() => setOpen(link.menu ?? null)}
                  onClick={() => setOpen(open === link.menu ? null : link.menu ?? null)}
                >
                  {link.label}
                  <Icon name="chevron" className="h-3.5 w-3.5 rotate-90" />
                </button>
              ) : (
                <Link href={link.href} className={cn("text-[13px] text-cream/90 hover:text-gold", pathname === link.href && "text-gold")}>
                  {link.label}
                </Link>
              )}
              {link.menu && open === link.menu ? (
                <div className="absolute top-full left-0 z-20 min-w-52 border border-gold/30 bg-panel py-2 shadow-2xl" onMouseEnter={() => setOpen(link.menu ?? null)}>
                  <Link href={link.href} className="block px-4 py-2 text-sm text-gold hover:bg-white/5">View all</Link>
                  {(link.menu === "shop" ? categories : collections).map((item) => (
                    <Link
                      key={item.slug}
                      href={link.menu === "shop" ? `/shop/${item.slug}` : `/collections/${item.slug}`}
                      className="block px-4 py-2 text-sm text-cream hover:bg-white/5 hover:text-gold"
                    >
                      {"label" in item ? item.label : item.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <form onSubmit={submitSearch} className="relative hidden lg:block">
            <div className="flex h-10 w-[230px] items-center gap-2 rounded-full border border-gold/40 px-4 xl:w-[280px]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search for jewelry..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-mute"
                aria-label="Search jewelry"
              />
              <button type="submit" aria-label="Search" className="text-gold">
                <Icon name="search" className="h-4 w-4" />
              </button>
            </div>
            {searchOpen && suggestions.length > 0 ? (
              <div className="absolute top-[calc(100%+8px)] right-0 z-20 w-full border border-gold/30 bg-panel py-1">
                {suggestions.map((product) => (
                  <Link key={product.slug} href={`/product/${product.slug}`} className="block px-4 py-2 text-sm hover:bg-white/5 hover:text-gold">
                    {product.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </form>

          <button type="button" className="grid h-10 w-10 place-items-center text-gold lg:hidden" aria-label="Search" onClick={() => setSearchOpen((value) => !value)}>
            <Icon name="search" className="h-5 w-5" />
          </button>
          <Link href="/account" aria-label="Account" className="hidden h-10 w-10 place-items-center text-cream hover:text-gold sm:grid">
            <Icon name="user" className="h-5 w-5" />
          </Link>
          <Link href="/wishlist" aria-label="Wishlist" className="relative grid h-10 w-10 place-items-center text-cream hover:text-gold">
            <Icon name="heart" className="h-5 w-5" />
            {ready && wishlist.length > 0 ? <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center bg-gold px-1 text-[10px] text-ink">{wishlist.length}</span> : null}
          </Link>
          <Link href="/cart" aria-label="Bag" className="relative grid h-10 w-10 place-items-center text-cream hover:text-gold">
            <Icon name="bag" className="h-5 w-5" />
            {ready && cartCount > 0 ? <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center bg-gold px-1 text-[10px] text-ink">{cartCount}</span> : null}
          </Link>
        </div>
      </Container>

      <div className="border-t border-white/5 text-[11px] text-mute sm:hidden">
        <Container className="flex h-10 items-center justify-between">
          <label className="inline-flex items-center gap-2">
            <Icon name="pin" className="h-3.5 w-3.5 text-gold" />
            <span>Deliver to</span>
            <select aria-label="Delivery city" value={city} onChange={(event) => setDeliverTo(event.target.value)} className="bg-transparent text-cream outline-none">
              {cities.map((item) => <option key={item} className="bg-ink text-cream">{item}</option>)}
            </select>
          </label>
          <Link href="/track" className="text-gold">Track</Link>
        </Container>
      </div>

      {searchOpen ? (
        <form onSubmit={submitSearch} className="border-t border-white/5 px-4 py-3 lg:hidden">
          <div className="flex h-11 items-center gap-2 rounded-full border border-gold/40 px-4">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for jewelry..." className="w-full bg-transparent text-sm outline-none" aria-label="Search jewelry" />
            <button type="submit" aria-label="Search" className="text-gold"><Icon name="search" className="h-4 w-4" /></button>
          </div>
          {suggestions.length > 0 ? (
            <div className="mt-2 border border-gold/30 bg-panel">
              {suggestions.map((product) => (
                <Link key={product.slug} href={`/product/${product.slug}`} className="block px-4 py-2 text-sm hover:text-gold">{product.name}</Link>
              ))}
            </div>
          ) : null}
        </form>
      ) : null}

      {menu ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink lg:hidden">
          <Container className="flex h-[72px] items-center justify-between">
            <Logo />
            <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid h-10 w-10 place-items-center text-gold">
              <Icon name="close" className="h-5 w-5" />
            </button>
          </Container>
          <nav className="flex flex-col px-6 pb-16">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="border-b border-line py-4 font-serif text-3xl text-cream">{link.label}</Link>
            ))}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Link key={category.slug} href={`/shop/${category.slug}`} className="border border-line px-3 py-3 text-sm tracking-[0.14em] text-gold uppercase">{category.label}</Link>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 text-sm text-mute">
              <Link href="/account" className="hover:text-gold">Account</Link>
              <Link href="/track" className="hover:text-gold">Track Order</Link>
              <Link href="/help" className="hover:text-gold">Help</Link>
              <a href="tel:+923001234567" className="text-gold">+92 300 1234567</a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
