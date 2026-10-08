import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/format";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Logo({ stacked = false }: { stacked?: boolean } = {}) {
  return (
    <Link href="/" className="flex min-w-0 max-w-full items-center gap-2 sm:gap-2.5" aria-label="Aura Loom Diamond">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/aura-loom-mark.svg" alt="" width={36} height={36} className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
      <span className="min-w-0 leading-none">
        <span
          className={cn(
            "block font-serif text-cream",
            stacked
              ? "text-[13px] tracking-[0.12em] sm:text-[14px] sm:tracking-[0.14em]"
              : "text-[10px] tracking-[0.08em] min-[360px]:text-[11px] min-[360px]:tracking-[0.1em] sm:text-[14px] sm:tracking-[0.14em] md:text-[15px] md:tracking-[0.16em] lg:text-[17px] lg:tracking-[0.18em]",
          )}
        >
          <span className={cn("block whitespace-nowrap", !stacked && "sm:inline")}>AURA LOOM</span>
          <span className={cn("block whitespace-nowrap", !stacked && "sm:ml-1.5 sm:inline")}>DIAMOND</span>
        </span>
        <span
          className={cn(
            "mt-1 tracking-[0.2em] text-gold sm:tracking-[0.28em] md:tracking-[0.32em]",
            stacked ? "block text-[8px] sm:text-[9px]" : "hidden text-[7px] min-[420px]:block sm:text-[8px] md:text-[9px]",
          )}
        >
          TIMELESS ELEGANCE
        </span>
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
        "inline-flex items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase transition disabled:cursor-not-allowed disabled:opacity-50",
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
        "inline-flex items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase transition",
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

export function Quantity({ value, onChange, max = 8 }: { value: number; onChange: (value: number) => void; max?: number }) {
  return (
    <div className="inline-flex items-center border border-line">
      <button type="button" className="px-3 py-2 text-gold" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Decrease quantity">
        <Icon name="minus" className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-8 text-center text-sm">{value}</span>
      <button type="button" className="px-3 py-2 text-gold" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase quantity" disabled={value >= max}>
        <Icon name="plus" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="aspect-[3/4] animate-pulse border border-line bg-card" />
      ))}
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
