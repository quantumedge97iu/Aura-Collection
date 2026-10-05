"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getProduct } from "@/lib/catalog";
import { cities } from "@/lib/content";

export type CartLine = { slug: string; qty: number; metal: string; size: string };
export type ShippingDetails = { name: string; phone: string; email: string; city: string; address: string; notes: string };
export type PaymentMethod = "cod" | "bank" | "card";
export type OrderItem = CartLine & { name: string; price: number; image: string };
export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  shipping: ShippingDetails;
  payment: PaymentMethod;
  cardLast4?: string;
  subtotal: number;
  shippingFee: number;
  total: number;
};
type Session = { name: string; email: string };
type Snapshot = { cart: CartLine[]; wishlist: string[]; orders: Order[]; session: Session | null; city: string };

const KEY = "luxe-jewels-v1";
const emptySnapshot: Snapshot = { cart: [], wishlist: [], orders: [], session: null, city: "Karachi" };

let memory: Snapshot = emptySnapshot;
let loaded = false;

function readSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Snapshot>;
    if (!Array.isArray(data.cart) || !Array.isArray(data.wishlist) || !Array.isArray(data.orders)) return null;
    return {
      cart: data.cart,
      wishlist: data.wishlist,
      orders: data.orders,
      session: data.session ?? null,
      city: typeof data.city === "string" && cities.includes(data.city) ? data.city : "Karachi",
    };
  } catch {
    return null;
  }
}

function ensure() {
  if (loaded || typeof window === "undefined") return;
  memory = readSnapshot() ?? emptySnapshot;
  loaded = true;
}

function getSnapshot() {
  ensure();
  return memory;
}

function getServerSnapshot() {
  return emptySnapshot;
}

function emit() {
  localStorage.setItem(KEY, JSON.stringify(memory));
  window.dispatchEvent(new Event("luxe-store"));
}

function updateStore(recipe: (current: Snapshot) => Snapshot) {
  ensure();
  memory = recipe(memory);
  emit();
}

function subscribe(callback: () => void) {
  const onStore = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    memory = readSnapshot() ?? emptySnapshot;
    loaded = true;
    callback();
  };
  window.addEventListener("luxe-store", onStore);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("luxe-store", onStore);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribeReady() {
  return () => {};
}

export function useClientReady() {
  return useSyncExternalStore(subscribeReady, () => true, () => false);
}

type StoreValue = {
  cart: CartLine[];
  wishlist: string[];
  orders: Order[];
  session: Session | null;
  city: string;
  cartCount: number;
  subtotal: number;
  addToCart: (line: CartLine) => void;
  setQty: (line: Pick<CartLine, "slug" | "metal" | "size">, qty: number) => void;
  removeLine: (line: Pick<CartLine, "slug" | "metal" | "size">) => void;
  toggleWish: (slug: string) => void;
  wished: (slug: string) => boolean;
  placeOrder: (shipping: ShippingDetails, payment: PaymentMethod, cardLast4?: string) => Order | null;
  setDeliverTo: (city: string) => void;
  signIn: (session: Session) => void;
  signOut: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function sameLine(a: Pick<CartLine, "slug" | "metal" | "size">, b: Pick<CartLine, "slug" | "metal" | "size">) {
  return a.slug === b.slug && a.metal === b.metal && a.size === b.size;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [toast, setToast] = useState<string | null>(null);
  const flash = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const addToCart = useCallback((line: CartLine) => {
    const product = getProduct(line.slug);
    if (!product) return;
    const qty = Math.min(8, Math.max(1, line.qty));
    updateStore((current) => {
      const index = current.cart.findIndex((item) => sameLine(item, line));
      const cart = index === -1
        ? [...current.cart, { ...line, qty }]
        : current.cart.map((item, itemIndex) => (itemIndex === index ? { ...item, qty: Math.min(8, item.qty + qty) } : item));
      return { ...current, cart };
    });
    flash(`${product.name} added to your bag`);
  }, [flash]);

  const setQty = useCallback((line: Pick<CartLine, "slug" | "metal" | "size">, qty: number) => {
    updateStore((current) => ({
      ...current,
      cart: current.cart.flatMap((item) => {
        if (!sameLine(item, line)) return [item];
        if (qty <= 0) return [];
        return [{ ...item, qty: Math.min(8, qty) }];
      }),
    }));
  }, []);

  const removeLine = useCallback((line: Pick<CartLine, "slug" | "metal" | "size">) => {
    updateStore((current) => ({ ...current, cart: current.cart.filter((item) => !sameLine(item, line)) }));
  }, []);

  const toggleWish = useCallback((slug: string) => {
    const has = snapshot.wishlist.includes(slug);
    const name = getProduct(slug)?.name ?? "Piece";
    updateStore((current) => ({
      ...current,
      wishlist: current.wishlist.includes(slug) ? current.wishlist.filter((item) => item !== slug) : [...current.wishlist, slug],
    }));
    flash(has ? "Removed from wishlist" : `${name} saved to wishlist`);
  }, [flash, snapshot.wishlist]);

  const wished = useCallback((slug: string) => snapshot.wishlist.includes(slug), [snapshot.wishlist]);

  const placeOrder = useCallback((shipping: ShippingDetails, payment: PaymentMethod, cardLast4?: string) => {
    if (snapshot.cart.length === 0) return null;
    const items: OrderItem[] = snapshot.cart.flatMap((line) => {
      const product = getProduct(line.slug);
      if (!product) return [];
      return [{ ...line, name: product.name, price: product.price, image: product.image }];
    });
    if (items.length === 0) return null;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const order: Order = {
      id: `LJ-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
      items,
      shipping,
      payment,
      cardLast4,
      subtotal,
      shippingFee: 0,
      total: subtotal,
    };
    updateStore((current) => ({ ...current, cart: [], orders: [order, ...current.orders].slice(0, 20) }));
    return order;
  }, [snapshot.cart]);

  const setDeliverTo = useCallback((city: string) => {
    if (!cities.includes(city) || getSnapshot().city === city) return;
    updateStore((current) => ({ ...current, city }));
  }, []);

  const signIn = useCallback((next: Session) => {
    updateStore((current) => ({ ...current, session: next }));
    flash(`Welcome, ${next.name.split(" ")[0]}`);
  }, [flash]);

  const signOut = useCallback(() => {
    updateStore((current) => ({ ...current, session: null }));
    flash("Signed out");
  }, [flash]);

  const cartCount = snapshot.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = snapshot.cart.reduce((sum, item) => sum + (getProduct(item.slug)?.price ?? 0) * item.qty, 0);

  const value = useMemo<StoreValue>(() => ({
    cart: snapshot.cart,
    wishlist: snapshot.wishlist,
    orders: snapshot.orders,
    session: snapshot.session,
    city: snapshot.city,
    cartCount,
    subtotal,
    addToCart,
    setQty,
    removeLine,
    toggleWish,
    wished,
    placeOrder,
    setDeliverTo,
    signIn,
    signOut,
  }), [snapshot, cartCount, subtotal, addToCart, setQty, removeLine, toggleWish, wished, placeOrder, setDeliverTo, signIn, signOut]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="fixed top-24 left-1/2 z-[70] -translate-x-1/2 border border-gold/50 bg-panel px-4 py-3 text-sm text-cream shadow-2xl">
          {toast}
        </div>
      ) : null}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}

export function paymentLabel(method: PaymentMethod) {
  if (method === "cod") return "Cash on Delivery";
  if (method === "bank") return "Bank Transfer";
  return "Debit / Credit Card";
}
