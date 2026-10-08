"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

export type ToastTone = "info" | "success" | "error";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

export function Toaster({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  const [top, setTop] = useState(124);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () => setTop(Math.ceil(header.getBoundingClientRect().height) + 12);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (items.length === 0) return null;
  return (
    <div
      className="pointer-events-none fixed right-3 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-5"
      style={{ top }}
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-md border border-[#8a6d3d] bg-gradient-to-b from-[#e6d3ae] to-[#c6a36a] px-3.5 py-3 text-sm leading-5 text-ink shadow-[0_16px_36px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.55)]"
        >
          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink ${item.tone === "error" ? "text-blush" : "text-gold-2"}`}>
            <Icon name={item.tone === "error" ? "close" : "check"} className="h-3 w-3" />
          </span>
          <p className="min-w-0 flex-1 font-medium">{item.message}</p>
          <button type="button" onClick={() => onDismiss(item.id)} aria-label="Dismiss notification" className="mt-0.5 text-ink/55 hover:text-ink">
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
