import type { ReactNode } from "react";

const glyphs: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20 20.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" />
    </>
  ),
  bag: (
    <>
      <path d="M6.5 8.5h11l-.8 11h-9.4l-.8-11Z" />
      <path d="M9 8.5V7.2A3 3 0 0 1 12 4a3 3 0 0 1 3 3.2v1.3" />
    </>
  ),
  heart: <path d="M12 19.2s-6.4-3.9-6.4-8.1A3.4 3.4 0 0 1 12 8a3.4 3.4 0 0 1 6.4 3.1c0 4.2-6.4 8.1-6.4 8.1Z" />,
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  star: <path d="m12 3.6 2.1 4.6 5 .6-3.7 3.4.9 4.9L12 14.8 7.7 17.1l.9-4.9L4.9 8.8l5-.6L12 3.6Z" />,
  truck: (
    <>
      <path d="M3 7.5h11v8H3v-8Z" />
      <path d="M14 10.5h4.2L21 13.5v2h-7" />
      <circle cx="7" cy="17.5" r="1.4" />
      <circle cx="17" cy="17.5" r="1.4" />
    </>
  ),
  shield: <path d="M12 3.5 19 6.2v5.4c0 4.2-2.8 6.8-7 8.4-4.2-1.6-7-4.2-7-8.4V6.2L12 3.5Z" />,
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M3 10h18" />
    </>
  ),
  refresh: <path d="M19 12a7 7 0 1 1-2-4.9M19 4.5V8h-3.5" />,
  phone: <path d="M8 4.5h2.2l1.2 3-1.6 1a11 11 0 0 0 5 5l1-1.6 3 1.2V17a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 6.5 6.1 1.5 1.5 0 0 1 8 4.5Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.4" />
      <path d="m4.5 7 7.5 6L19.5 7" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="1.8" />
    </>
  ),
  minus: <path d="M6 12h12" />,
  plus: (
    <>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 7.5" />,
  chat: (
    <>
      <path d="M5 16.5 3.8 20 8 18.2A8.2 8.2 0 1 0 5 16.5Z" />
    </>
  ),
  facebook: <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1Z" fill="currentColor" stroke="none" />,
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: <path d="M14 6.2c.6 2.2 2.2 3.6 4.2 3.8v2.4c-1.5 0-2.9-.5-4.2-1.4v5.6a5.2 5.2 0 1 1-5.2-5.2c.3 0 .6 0 .8.1v2.6a2.6 2.6 0 1 0 1.8 2.5V6.2H14Z" />,
  youtube: <path d="M20.2 8.2a2.4 2.4 0 0 0-1.7-1.7C16.8 6 12 6 12 6s-4.8 0-6.5.5a2.4 2.4 0 0 0-1.7 1.7A25 25 0 0 0 3.3 12a25 25 0 0 0 .5 3.8 2.4 2.4 0 0 0 1.7 1.7C7.2 18 12 18 12 18s4.8 0 6.5-.5a2.4 2.4 0 0 0 1.7-1.7 25 25 0 0 0 .5-3.8 25 25 0 0 0-.5-3.8ZM10.5 14.8V9.2L15.2 12l-4.7 2.8Z" fill="currentColor" stroke="none" />,
};

export type IconName = keyof typeof glyphs;

export function Icon({ name, className, filled = false }: { name: IconName; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden>
      {glyphs[name]}
    </svg>
  );
}
