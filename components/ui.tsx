import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/format";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <path d="M24 6c2.2 4.2 2.2 8.2 0 12.2-2.2-4-2.2-8 0-12.2Z" />
        <path d="M24 42c-2.2-4.2-2.2-8.2 0-12.2 2.2 4 2.2 8 0 12.2Z" />
        <path d="M6 24c4.2-2.2 8.2-2.2 12.2 0-4 2.2-8 2.2-12.2 0Z" />
        <path d="M42 24c-4.2 2.2-8.2 2.2-12.2 0 4-2.2 8-2.2 12.2 0Z" />
        <path d="M11 11c3.4 2.6 6.2 6.4 7.2 10.2-3.6-1.2-7.4-4-10.2-7.2 1-1 2-2 3-3Z" />
        <path d="M37 11c-1 1-2 2-3 3-2.8 3.2-6.6 6-10.2 7.2 1-3.8 3.8-7.6 7.2-10.2 1 1 2 2 3 3Z" />
        <circle cx="24" cy="24" r="1.7" fill="currentColor" stroke="none" />
      </svg>
      <span className="leading-none">
        <span className="block font-serif text-[15px] tracking-[0.18em] text-cream sm:text-[20px] sm:tracking-[0.22em]">LUXE JEWELS</span>
        <span className="mt-1 block text-[8px] tracking-[0.28em] text-gold sm:text-[9px] sm:tracking-[0.32em]">TIMELESS ELEGANCE</span>
      </span>
    </Link>
  );
}

const buttonVariants = {
  gold: "bg-gold text-ink hover:bg-gold-2",
  line: "border border-gold/70 text-gold hover:bg-gold hover:text-ink",
  ghost: "text-cream hover:text-gold",
};

export function Button({
  variant = "gold",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase transition disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "gold",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase transition",
        buttonVariants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="max-w-2xl">
      <p className="text-[11px] tracking-[0.32em] text-gold uppercase">{eyebrow}</p>
      <h1 className="mt-2 font-serif text-4xl text-cream sm:text-5xl">{title}</h1>
      {subtitle ? <p className="mt-3 text-sm leading-6 text-mute sm:text-base">{subtitle}</p> : null}
    </header>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-gold" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Icon key={index} name="star" className="h-3.5 w-3.5" filled={index < Math.round(value)} />
      ))}
    </span>
  );
}

export function Quantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center border border-line">
      <button type="button" className="px-3 py-2 text-gold" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Decrease quantity">
        <Icon name="minus" className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-8 text-center text-sm">{value}</span>
      <button type="button" className="px-3 py-2 text-gold" onClick={() => onChange(Math.min(8, value + 1))} aria-label="Increase quantity">
        <Icon name="plus" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export const fieldClass =
  "w-full border border-line bg-transparent px-3.5 py-3 text-sm text-cream outline-none placeholder:text-mute/70 focus:border-gold";

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] tracking-[0.16em] text-mute uppercase">{label}</span>
      <input className={fieldClass} {...props} />
      {error ? <span className="mt-1.5 block text-xs text-blush">{error}</span> : null}
    </label>
  );
}

export function EmptyState({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <div className="border border-line px-6 py-16 text-center">
      <h2 className="font-serif text-3xl text-cream">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-mute">{text}</p>
      <ButtonLink href={href} className="mt-6">
        {action}
      </ButtonLink>
    </div>
  );
}
