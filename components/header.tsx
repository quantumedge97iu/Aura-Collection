"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mobileSearch, setMobileSearch] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activePath, setActivePath] = useState(pathname);
  const suggestions = query.trim().length > 1 ? searchProducts(query).slice(0, 5) : [];

  if (activePath !== pathname) {
    setActivePath(pathname);
    setMenu(false);
    setOpen(null);
    setMobileSearch(false);
    setSuggesting(false);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setMobileSearch(false);
    setSuggesting(false);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  const drawer = menu ? (
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gold/20 px-5">
        <Logo />
        <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid h-10 w-10 place-items-center text-gold">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-5 pt-2 pb-28">
        {links.map((link) => {
          const active = link.href === "/shop" ? pathname === "/shop" : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between border-b border-line py-4 text-[15px] tracking-[0.04em] text-cream hover:text-gold",
                active && "text-gold",
              )}
            >
              {link.label}
              <Icon name="chevron" className="h-4 w-4 text-gold" />
            </Link>
          );
        })}
        <p className="mt-8 text-[11px] tracking-[0.28em] text-gold uppercase">Categories</p>
        <div className="mt-3 grid grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop/${category.slug}`}
              className={cn(
                "border-b border-line py-3.5 text-[13px] tracking-[0.04em] text-cream/90 hover:text-gold",
                pathname === `/shop/${category.slug}` && "text-gold",
              )}
            >
              {category.label}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-4 text-[13px] tracking-[0.04em] text-mute">
          <Link href="/account" className="hover:text-gold">Account</Link>
          <Link href="/track" className="hover:text-gold">Track Order</Link>
          <Link href="/help" className="hover:text-gold">Help</Link>
          <a href="tel:+923001234567" className="text-gold">+92 300 1234567</a>
        </div>
      </nav>
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-ink/95 text-cream backdrop-blur">
      <div className="hidden border-b border-white/5 text-[11px] text-mute sm:block">
        <Container className="flex h-9 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 lg:gap-6">
            <span className="inline-flex min-w-0 items-center gap-1.5"><Icon name="truck" className="h-3.5 w-3.5 shrink-0 text-gold" /> <span className="truncate">Free delivery<span className="hidden lg:inline"> across Pakistan</span></span></span>
            <span className="hidden items-center gap-1.5 md:inline-flex"><Icon name="card" className="h-3.5 w-3.5 text-gold" /> <span className="hidden lg:inline">Cash on delivery</span><span className="lg:hidden">COD</span></span>
            <span className="hidden items-center gap-1.5 xl:inline-flex"><Icon name="shield" className="h-3.5 w-3.5 text-gold" /> Secure payments</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 lg:gap-4">
            <label className="inline-flex items-center gap-2">
              <Icon name="pin" className="h-3.5 w-3.5 text-gold" />
              <span className="hidden lg:inline">Deliver to</span>
              <select aria-label="Delivery city" value={city} onChange={(event) => setDeliverTo(event.target.value)} className="max-w-[7.5rem] truncate bg-transparent text-cream outline-none">
                {cities.map((item) => <option key={item} className="bg-ink text-cream">{item}</option>)}
              </select>
            </label>
            <Link href="/track" className="hover:text-gold">Track Order</Link>
            <Link href="/help" className="hover:text-gold">Help</Link>
            <a href="mailto:fatahfizza07@gmail.com" className="hidden items-center gap-1.5 text-gold 2xl:inline-flex">
              <Icon name="mail" className="h-3.5 w-3.5" /> fatahfizza07@gmail.com
            </a>
            <a href="tel:+923200005764" className="hidden items-center gap-1.5 text-gold xl:inline-flex">
              <Icon name="phone" className="h-3.5 w-3.5" /> 03200005764
            </a>
          </div>
        </Container>
      </div>

      <div className={cn("border-b border-white/5 text-[11px] text-mute sm:hidden", mobileSearch && "hidden")}>
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

      {mobileSearch ? (
        <div className="border-b border-white/5 xl:hidden">
          <form onSubmit={submitSearch} className="flex h-[72px] items-center gap-2 px-3">
            <button type="button" aria-label="Close search" onClick={() => { setMobileSearch(false); setQuery(""); }} className="grid h-10 w-10 shrink-0 place-items-center text-gold">
              <Icon name="close" className="h-5 w-5" />
            </button>
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-gold/40 px-4">
              <Icon name="search" className="h-4 w-4 shrink-0 text-gold" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for jewelry..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute"
                aria-label="Search jewelry"
              />
            </div>
          </form>
          {suggestions.length > 0 ? (
            <div className="border-t border-white/5">
              {suggestions.map((product) => (
                <Link key={product.slug} href={`/product/${product.slug}`} className="block px-5 py-3 text-sm hover:text-gold">{product.name}</Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <Container className={cn("flex h-[72px] items-center gap-3 lg:gap-8", mobileSearch && "hidden xl:flex")}>
        <button type="button" className="grid h-10 w-10 shrink-0 place-items-center text-gold xl:hidden" aria-label="Open menu" onClick={() => setMenu(true)}>
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <Logo />

        <nav className="ml-4 hidden items-center gap-4 xl:flex 2xl:gap-6">
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
          <form onSubmit={submitSearch} className="relative hidden xl:block">
            <div className="flex h-10 w-[200px] items-center gap-2 rounded-full border border-gold/40 px-4 2xl:w-[280px]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSuggesting(true)}
                placeholder="Search for jewelry..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-mute"
                aria-label="Search jewelry"
              />
              <button type="submit" aria-label="Search" className="text-gold">
                <Icon name="search" className="h-4 w-4" />
              </button>
            </div>
            {suggesting && suggestions.length > 0 ? (
              <div className="absolute top-[calc(100%+8px)] right-0 z-20 w-full border border-gold/30 bg-panel py-1">
                {suggestions.map((product) => (
                  <Link key={product.slug} href={`/product/${product.slug}`} className="block px-4 py-2 text-sm hover:bg-white/5 hover:text-gold">
                    {product.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </form>

          <button type="button" className="grid h-10 w-10 shrink-0 place-items-center text-gold xl:hidden" aria-label="Search" onClick={() => setMobileSearch(true)}>
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

      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </header>
  );
}
