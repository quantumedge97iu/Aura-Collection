import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { OpenAura, Newsletter } from "@/components/newsletter";
import { Container, Logo } from "@/components/ui";

const columns: Array<{ title: string; links: Array<{ href: string; label: string; aura?: boolean }> }> = [
  {
    title: "Customer Care",
    links: [
      { href: "/help#contact", label: "Contact Us" },
      { href: "/track", label: "Order Tracking" },
      { href: "/help", label: "Help & FAQ" },
      { href: "/help", label: "Live Chat", aura: true },
    ],
  },
  {
    title: "Shipping & Returns",
    links: [
      { href: "/policies/shipping", label: "Shipping Policy" },
      { href: "/policies/returns", label: "Return & Exchange" },
      { href: "/policies/cancellation", label: "Cancellation Policy" },
    ],
  },
  {
    title: "Information",
    links: [
      { href: "/policies/privacy", label: "Privacy Policy" },
      { href: "/policies/terms", label: "Terms & Conditions" },
      { href: "/policies/jewelry-care", label: "Jewelry Care" },
      { href: "/policies/size-guide", label: "Size Guide" },
    ],
  },
];

const socials: Array<{ name: IconName; label: string; href: string }> = [
  { name: "facebook", label: "Facebook", href: "https://facebook.com" },
  { name: "instagram", label: "Instagram", href: "https://instagram.com" },
  { name: "tiktok", label: "TikTok", href: "https://tiktok.com" },
  { name: "youtube", label: "YouTube", href: "https://youtube.com" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gold/20">
      <Container className="grid gap-8 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Stay in the loop</p>
          <p className="mt-2 text-sm text-mute">Get the latest collections, offers and exclusive updates.</p>
        </div>
        <Newsletter />
      </Container>

      <div className="border-t border-white/5">
        <Container className="grid gap-10 py-12 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.15fr)_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 xl:col-span-1">
            <Logo />
            <div className="mt-5 flex gap-3">
              {socials.map((item) => (
                <a key={item.name} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 text-gold hover:bg-gold hover:text-ink">
                  <Icon name={item.name} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-[11px] tracking-[0.22em] text-cream uppercase">{column.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-mute">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.aura ? (
                      <OpenAura className="hover:text-gold">{link.label}</OpenAura>
                    ) : (
                      <Link href={link.href} className="hover:text-gold">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="text-[11px] tracking-[0.22em] text-cream uppercase">Get in Touch</h2>
            <ul className="mt-4 space-y-3 text-sm text-mute">
              <li className="flex items-center gap-2">
                <Icon name="mail" className="h-4 w-4 shrink-0 text-gold" />
                <a href="mailto:fatahfizza07@gmail.com" className="min-w-0 break-all hover:text-gold">fatahfizza07@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="phone" className="h-4 w-4 shrink-0 text-gold" />
                <a href="tel:+923200005764" className="hover:text-gold">03200005764</a>
              </li>
              <li className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4 text-gold" /> Karachi, Pakistan</li>
            </ul>
          </div>
        </Container>
      </div>
      <Container className="border-t border-white/5 py-5 text-xs text-mute">© {new Date().getFullYear()} Luxe Jewels. All rights reserved.</Container>
    </footer>
  );
}
