"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, type ToastItem, type ToastTone } from "@/components/toaster";
import { ApiError, api } from "@/lib/api";
import type { CityOption, Product } from "@/lib/catalog";
import { toProduct } from "@/lib/shop";

export type CartLine = {
  variantId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  metal: string;
  size: string;
  qty: number;
  available: number;
};
export type ShippingDetails = { name: string; phone: string; email: string; city: string; address: string; notes: string };
export type PaymentMethod = "cod" | "bank" | "card";
export type OrderItem = { slug: string; name: string; image: string; price: number; metal: string; size: string; qty: number };
export type Order = {
  id: string;
  number: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
  shipping: ShippingDetails;
  payment: PaymentMethod;
  cardLast4?: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  tracking: string;
  eta: string | null;
  shipmentStatus: string | null;
  history: Array<{ status: string; at: string }>;
  partial: boolean;
};
export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};
type Session = { id: string; name: string; email: string; phone: string | null; avatarUrl: string | null };
type Saved = { token: string | null; cartId: string | null; guestToken: string | null; city: string; orders: Order[] };

const KEY = "luxe-api-v1";
const TOAST_KEY = "luxe-toasts";

function readToasts(): ToastItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(TOAST_KEY);
    const items = raw ? JSON.parse(raw) as ToastItem[] : [];
    return Array.isArray(items) ? items.filter((item) => item && typeof item.id === "string" && typeof item.message === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

function writeToasts(items: ToastItem[]) {
  sessionStorage.setItem(TOAST_KEY, JSON.stringify(items));
}

function readSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Saved>;
    return {
      token: typeof data.token === "string" ? data.token : null,
      cartId: typeof data.cartId === "string" ? data.cartId : null,
      guestToken: typeof data.guestToken === "string" ? data.guestToken : null,
      city: typeof data.city === "string" ? data.city : "Karachi",
      orders: Array.isArray(data.orders) ? data.orders : [],
    };
  } catch {
    return null;
  }
}

function messageOf(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "The house could not complete that.";
}

export function toOrder(raw: Record<string, unknown>): Order {
  const shipping = (raw.shippingAddress ?? {}) as Partial<ShippingDetails>;
  const payment = (raw.payment ?? {}) as { method?: PaymentMethod; status?: string; card_last4?: string | null };
  const shipment = (raw.shipment ?? {}) as { tracking?: string; eta?: string | null; status?: string | null };
  const rows = Array.isArray(raw.items) ? raw.items as Array<Record<string, unknown>> : [];
  const method = (payment.method ?? raw.method ?? "cod") as PaymentMethod;
  return {
    id: String(raw.id ?? ""),
    number: String(raw.number ?? ""),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    status: String(raw.status ?? "created"),
    paymentStatus: String(raw.paymentStatus ?? payment.status ?? "pending"),
    items: rows.map((item) => {
      const label = String(item.variant_label ?? "");
      const [metal, size] = label.split(" / ");
      return {
        slug: String(item.slug ?? ""),
        name: String(item.product_name ?? item.name ?? "Piece"),
        image: String(item.image_url ?? item.image ?? ""),
        price: Number(item.unit_price ?? item.price ?? 0),
        metal: metal || String(item.metal ?? ""),
        size: size || String(item.size ?? ""),
        qty: Number(item.quantity ?? item.qty ?? 1),
      };
    }),
    shipping: {
      name: shipping.name ?? "",
      phone: shipping.phone ?? "",
      email: shipping.email ?? String(raw.email ?? ""),
      city: shipping.city ?? String(raw.city ?? ""),
      address: shipping.address ?? "",
      notes: shipping.notes ?? "",
    },
    payment: method === "bank" || method === "card" ? method : "cod",
    cardLast4: payment.card_last4 ?? undefined,
    subtotal: Number(raw.subtotal ?? raw.total ?? 0),
    discount: Number(raw.discount ?? 0),
    shippingFee: Number(raw.shippingFee ?? 0),
    total: Number(raw.total ?? 0),
    tracking: shipment.tracking ?? "",
    eta: shipment.eta ?? null,
    shipmentStatus: shipment.status ?? null,
    history: Array.isArray(raw.history)
      ? (raw.history as Array<Record<string, unknown>>).map((entry) => ({ status: String(entry.new_status ?? ""), at: String(entry.created_at ?? "") }))
      : [],
    partial: raw.shippingAddress == null,
  };
}

function mapLines(items: Array<Record<string, unknown>>): CartLine[] {
  return items.map((item) => ({
    variantId: String(item.variantId),
    slug: String(item.slug),
    name: String(item.name),
    image: String(item.imageUrl ?? ""),
    price: Number(item.price),
    metal: String(item.metal),
    size: String(item.size),
    qty: Number(item.quantity),
    available: Number(item.available),
  }));
}

type StoreValue = {
  ready: boolean;
  cart: CartLine[];
  wishlist: Product[];
  orders: Order[];
  addresses: Address[];
  session: Session | null;
  city: string;
  cities: CityOption[];
  cartCount: number;
  subtotal: number;
  notice: string | null;
  addToCart: (line: CartLine) => Promise<void>;
  setQty: (variantId: string, qty: number) => Promise<void>;
  removeLine: (variantId: string) => Promise<void>;
  toggleWish: (product: Product) => Promise<void>;
  wished: (slug: string) => boolean;
  placeOrder: (shipping: ShippingDetails, payment: PaymentMethod, cardLast4?: string) => Promise<Order>;
  cancelOrder: (order: Order) => Promise<void>;
  lookupOrder: (number: string, email: string) => Promise<Order | null>;
  loadOrder: (number: string) => Promise<Order | null>;
  setDeliverTo: (city: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  resendConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  acceptSession: (token: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (input: { fullName: string; phone: string | null }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  clearAvatar: () => Promise<void>;
  addAddress: (input: { fullName: string; phone: string; line1: string; city: string; isDefaultShipping?: boolean }) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  writeReview: (slug: string, input: { rating: number; title: string; body: string }) => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, cities }: { children: React.ReactNode; cities: CityOption[] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [city, setCity] = useState(cities[0]?.city ?? "Karachi");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimers = useRef(new Map<string, number>());
  const bag = useRef({ token: null as string | null, cartId: null as string | null, guestToken: null as string | null, city: cities[0]?.city ?? "Karachi" });
  const avatarBlob = useRef<string | null>(null);
  const cartRef = useRef(cart);
  const ordersRef = useRef(orders);
  const bootRef = useRef<Promise<void>>(Promise.resolve());
  cartRef.current = cart;
  ordersRef.current = orders;

  const publishToasts = useCallback((next: ToastItem[]) => {
    writeToasts(next);
    setToasts(next);
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    toastTimers.current.delete(id);
    const next = readToasts().filter((item) => item.id !== id);
    writeToasts(next);
    setToasts(next);
  }, []);

  const armToast = useCallback((id: string) => {
    const timer = window.setTimeout(() => dismiss(id), 4200);
    toastTimers.current.set(id, timer);
  }, [dismiss]);

  const flash = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    const next = [{ id, message, tone }, ...readToasts()].slice(0, 4);
    publishToasts(next);
    armToast(id);
  }, [armToast, publishToasts]);

  useEffect(() => {
    const saved = readToasts();
    if (saved.length === 0) return;
    setToasts(saved);
    saved.forEach((item) => armToast(item.id));
  }, [armToast]);

  const persist = useCallback((nextOrders = ordersRef.current) => {
    const saved: Saved = { ...bag.current, orders: nextOrders };
    localStorage.setItem(KEY, JSON.stringify(saved));
  }, []);

  const authHeaders = useCallback(() => ({ token: bag.current.token, cartToken: bag.current.guestToken }), []);

  const pullCart = useCallback(async (cartId: string) => {
    const payload = await api<{ id: string; items: Array<Record<string, unknown>> }>(`/v1/carts/${cartId}`, authHeaders());
    const lines = mapLines(payload.items);
    setCart(lines);
    return lines;
  }, [authHeaders]);

  const pullAccount = useCallback(async () => {
    const [me, wishes, mine, places] = await Promise.all([
      api<{ id: string; fullName: string; email: string | null; phone: string | null; avatarUrl: string | null }>("/v1/me", authHeaders()),
      api<{ items: Array<Record<string, unknown>> }>("/v1/wishlist", authHeaders()),
      api<{ items: Array<Record<string, unknown>> }>("/v1/orders", authHeaders()),
      api<{ items: Address[] }>("/v1/me/addresses", authHeaders()),
    ]);
    const avatarUrl = me.avatarUrl ? await loadAvatar(bag.current.token, avatarBlob) : forgetAvatar(avatarBlob);
    setSession({ id: me.id, name: me.fullName, email: me.email ?? "", phone: me.phone, avatarUrl });
    setWishlist(wishes.items.map((item) => toProduct(item as unknown as Parameters<typeof toProduct>[0])));
    setAddresses(places.items);
    const previous = ordersRef.current;
    const listed = mine.items.map((item) => {
      const full = previous.find((order) => order.id === item.id && !order.partial);
      return full ?? toOrder(item);
    });
    setOrders(listed);
    ordersRef.current = listed;
  }, [authHeaders]);

  useEffect(() => {
    let cancel = false;
    const job = (async () => {
      const saved = readSaved();
      if (saved) {
        bag.current = { token: saved.token, cartId: saved.cartId, guestToken: saved.guestToken, city: saved.city };
        ordersRef.current = saved.orders;
        if (!cancel) setCity(saved.city);
        if (saved.orders.length > 0 && !cancel) setOrders(saved.orders);
      }
      if (bag.current.token) {
        try {
          await pullAccount();
          const opened = await api<{ id: string }>("/v1/carts", { method: "POST", token: bag.current.token });
          bag.current.cartId = opened.id;
          bag.current.guestToken = null;
          await pullCart(opened.id);
        } catch {
          bag.current.token = null;
          if (!cancel) setSession(null);
        }
      } else if (bag.current.cartId && bag.current.guestToken) {
        try {
          await pullCart(bag.current.cartId);
        } catch {
          bag.current.cartId = null;
          bag.current.guestToken = null;
        }
      }
      if (!cancel) {
        persist();
        setReady(true);
      }
    })();
    bootRef.current = job.then(() => undefined);
    return () => {
      cancel = true;
    };
  }, [persist, pullAccount, pullCart]);

  const ensureCart = useCallback(async () => {
    await bootRef.current;
    if (bag.current.cartId) return bag.current.cartId;
    const opened = await api<{ id: string; guestToken: string | null }>("/v1/carts", { method: "POST", token: bag.current.token });
    bag.current.cartId = opened.id;
    if (opened.guestToken) bag.current.guestToken = opened.guestToken;
    persist();
    return opened.id;
  }, [persist]);

  const requireSignIn = useCallback(async (message: string) => {
    await bootRef.current;
    if (bag.current.token) return true;
    flash(message);
    router.push("/account");
    return false;
  }, [flash, router]);

  const addToCart = useCallback(async (line: CartLine) => {
    if (!(await requireSignIn("Sign in to add this piece to your bag."))) return;
    const previous = cartRef.current;
    const index = previous.findIndex((item) => item.variantId === line.variantId);
    const qty = Math.min(8, Math.max(1, line.qty));
    const optimistic = index === -1
      ? [...previous, { ...line, qty }]
      : previous.map((item, itemIndex) => (itemIndex === index ? { ...item, qty: Math.min(8, item.qty + qty) } : item));
    setCart(optimistic);
    flash(`${line.name} added to your bag`, "success");
    try {
      const cartId = await ensureCart();
      const payload = await api<{ id: string; items: Array<Record<string, unknown>> }>(`/v1/carts/${cartId}/items`, {
        method: "POST",
        body: JSON.stringify({ variantId: line.variantId, quantity: qty }),
        ...authHeaders(),
      });
      setCart(mapLines(payload.items));
    } catch (error) {
      setCart(previous);
      flash(messageOf(error), "error");
    }
  }, [authHeaders, ensureCart, flash, requireSignIn]);

  const setQty = useCallback(async (variantId: string, qty: number) => {
    const previous = cartRef.current;
    const next = qty <= 0 ? previous.filter((item) => item.variantId !== variantId) : previous.map((item) => (item.variantId === variantId ? { ...item, qty: Math.min(8, qty) } : item));
    setCart(next);
    try {
      const cartId = bag.current.cartId;
      if (!cartId) return;
      const payload = await api<{ items: Array<Record<string, unknown>> }>(`/v1/carts/${cartId}/items/${variantId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: Math.max(0, Math.min(8, qty)) }),
        ...authHeaders(),
      });
      setCart(mapLines(payload.items));
    } catch (error) {
      setCart(previous);
      flash(messageOf(error), "error");
    }
  }, [authHeaders, flash]);

  const removeLine = useCallback(async (variantId: string) => {
    await setQty(variantId, 0);
  }, [setQty]);

  const toggleWish = useCallback(async (product: Product) => {
    if (!(await requireSignIn("Sign in to save a wishlist."))) return;
    const has = wishlist.some((item) => item.slug === product.slug);
    setWishlist((current) => (has ? current.filter((item) => item.slug !== product.slug) : [product, ...current]));
    flash(has ? "Removed from wishlist" : `${product.name} saved to wishlist`, "success");
    try {
      if (has) await api(`/v1/wishlist/${product.id}`, { method: "DELETE", token: bag.current.token });
      else await api("/v1/wishlist", { method: "POST", body: JSON.stringify({ productId: product.id }), token: bag.current.token });
    } catch (error) {
      setWishlist((current) => (has ? [product, ...current] : current.filter((item) => item.slug !== product.slug)));
      flash(messageOf(error), "error");
    }
  }, [flash, requireSignIn, wishlist]);

  const wished = useCallback((slug: string) => wishlist.some((item) => item.slug === slug), [wishlist]);

  const remember = useCallback((order: Order) => {
    const next = [order, ...ordersRef.current.filter((item) => item.id !== order.id)].slice(0, 20);
    ordersRef.current = next;
    setOrders(next);
    persist(next);
  }, [persist]);

  const placeOrder = useCallback(async (shipping: ShippingDetails, payment: PaymentMethod, cardLast4?: string) => {
    await bootRef.current;
    const cartId = bag.current.cartId;
    if (!cartId) throw new ApiError(422, "cart_empty", "Your cart is empty.");
    const order = toOrder(await api<Record<string, unknown>>("/v1/checkout", {
      method: "POST",
      headers: { "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ cartId, email: shipping.email, method: payment, cardLast4, shipping: { name: shipping.name, phone: shipping.phone, city: shipping.city, address: shipping.address, notes: shipping.notes } }),
      ...authHeaders(),
    }));
    setCart([]);
    remember(order);
    return order;
  }, [authHeaders, remember]);

  const cancelOrder = useCallback(async (order: Order) => {
    await api(`/v1/orders/${order.id}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Cancelled by customer" }), token: bag.current.token });
    const next = toOrder(await api<Record<string, unknown>>(`/v1/orders/${order.id}`, { token: bag.current.token }));
    remember(next);
    flash("Order cancelled", "success");
  }, [flash, remember]);

  const lookupOrder = useCallback(async (number: string, email: string) => {
    try {
      const order = toOrder(await api<Record<string, unknown>>(`/v1/orders/lookup?number=${encodeURIComponent(number)}&email=${encodeURIComponent(email)}`));
      remember(order);
      return order;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }, [remember]);

  const loadOrder = useCallback(async (number: string) => {
    await bootRef.current;
    const known = ordersRef.current.find((order) => order.number.toLowerCase() === number.toLowerCase() || order.id === number);
    if (known && !known.partial) return known;
    if (!bag.current.token || !known) return known ?? null;
    const full = toOrder(await api<Record<string, unknown>>(`/v1/orders/${known.id}`, { token: bag.current.token }));
    remember(full);
    return full;
  }, [remember]);

  const setDeliverTo = useCallback((next: string) => {
    bag.current.city = next;
    setCity(next);
    persist();
  }, [persist]);

  const adopt = useCallback(async (token: string) => {
    const guest = bag.current.guestToken;
    bag.current.token = token;
    if (guest) {
      try {
        const claimed = await api<{ id: string }>("/v1/carts/claim", { method: "POST", body: JSON.stringify({ token: guest }), token });
        bag.current.cartId = claimed.id;
        bag.current.guestToken = null;
      } catch {
        bag.current.guestToken = null;
      }
    }
    await pullAccount();
    const opened = await api<{ id: string }>("/v1/carts", { method: "POST", token });
    bag.current.cartId = opened.id;
    await pullCart(opened.id);
    persist();
  }, [persist, pullAccount, pullCart]);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api<{ accessToken?: string; confirmationRequired?: boolean }>("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (!session.accessToken) throw new ApiError(401, "unauthorized", "Sign in again.");
    await adopt(session.accessToken);
    flash("Welcome back", "success");
  }, [adopt, flash]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const session = await api<{ accessToken?: string; confirmationRequired?: boolean }>("/v1/auth/register", { method: "POST", body: JSON.stringify({ email, password, fullName: name }) });
    if (session.confirmationRequired) return "We sent a confirmation link to your email. Open it and your profile dashboard will open so you can save your details. After that, sign in from this page for full access.";
    if (!session.accessToken) throw new ApiError(401, "unauthorized", "The account was not created.");
    await adopt(session.accessToken);
    flash("Account created. Complete your profile.", "success");
    return null;
  }, [adopt, flash]);

  const resendConfirmation = useCallback(async (email: string) => {
    await api("/v1/auth/resend", { method: "POST", body: JSON.stringify({ email }) });
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await api("/v1/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
  }, []);

  const acceptSession = useCallback(async (token: string) => {
    await adopt(token);
  }, [adopt]);

  const signOut = useCallback(() => {
    bag.current.token = null;
    bag.current.cartId = null;
    bag.current.guestToken = null;
    forgetAvatar(avatarBlob);
    setSession(null);
    setCart([]);
    setWishlist([]);
    setAddresses([]);
    persist();
    flash("Signed out", "success");
  }, [flash, persist]);

  const updateProfile = useCallback(async (input: { fullName: string; phone: string | null }) => {
    const me = await api<{ id: string; fullName: string; email: string | null; phone: string | null; avatarUrl: string | null }>("/v1/me", { method: "PATCH", body: JSON.stringify(input), token: bag.current.token });
    setSession((current) => ({ id: me.id, name: me.fullName, email: me.email ?? "", phone: me.phone, avatarUrl: current?.avatarUrl ?? null }));
    flash("Profile saved", "success");
  }, [flash]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!bag.current.token) throw new ApiError(401, "unauthorized", "Sign in again.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new ApiError(400, "invalid_request", "Use a JPG, PNG, or WebP photo.");
    if (file.size > 1_200_000) throw new ApiError(400, "invalid_request", "Use a photo under 1.2 MB.");
    const data = await readPhoto(file);
    await api("/v1/me/avatar", { method: "POST", body: JSON.stringify({ mime: file.type, data }), token: bag.current.token });
    const avatarUrl = await loadAvatar(bag.current.token, avatarBlob);
    setSession((current) => current ? { ...current, avatarUrl } : current);
  }, []);

  const clearAvatar = useCallback(async () => {
    await api("/v1/me/avatar", { method: "DELETE", token: bag.current.token });
    forgetAvatar(avatarBlob);
    setSession((current) => current ? { ...current, avatarUrl: null } : current);
    flash("Photo removed", "success");
  }, [flash]);

  const addAddress = useCallback(async (input: { fullName: string; phone: string; line1: string; city: string; isDefaultShipping?: boolean }) => {
    await api("/v1/me/addresses", { method: "POST", body: JSON.stringify(input), token: bag.current.token });
    const places = await api<{ items: Address[] }>("/v1/me/addresses", { token: bag.current.token });
    setAddresses(places.items);
    flash("Address saved", "success");
  }, [flash]);

  const writeReview = useCallback(async (slug: string, input: { rating: number; title: string; body: string }) => {
    if (!bag.current.token) throw new ApiError(401, "unauthorized", "Sign in to write a review.");
    await api(`/v1/products/${encodeURIComponent(slug)}/reviews`, { method: "POST", body: JSON.stringify(input), token: bag.current.token });
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    const previous = addresses;
    setAddresses((current) => current.filter((item) => item.id !== id));
    try {
      await api(`/v1/me/addresses/${id}`, { method: "DELETE", token: bag.current.token });
    } catch (error) {
      setAddresses(previous);
      flash(messageOf(error), "error");
    }
  }, [addresses, flash]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const value = useMemo<StoreValue>(() => ({
    ready, cart, wishlist, orders, addresses, session, city, cities, cartCount, subtotal, notice: toasts[0]?.message ?? null,
    addToCart, setQty, removeLine, toggleWish, wished, placeOrder, cancelOrder, lookupOrder, loadOrder,
    setDeliverTo, signIn, register, resendConfirmation, requestPasswordReset, acceptSession, signOut, updateProfile, uploadAvatar, clearAvatar, addAddress, removeAddress, writeReview,
  }), [ready, cart, wishlist, orders, addresses, session, city, cities, cartCount, subtotal, toasts, addToCart, setQty, removeLine, toggleWish, wished, placeOrder, cancelOrder, lookupOrder, loadOrder, setDeliverTo, signIn, register, resendConfirmation, requestPasswordReset, acceptSession, signOut, updateProfile, uploadAvatar, clearAvatar, addAddress, removeAddress, writeReview]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <Toaster items={toasts} onDismiss={dismiss} />
    </StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}

function forgetAvatar(slot: { current: string | null }) {
  if (slot.current) URL.revokeObjectURL(slot.current);
  slot.current = null;
  return null;
}

async function loadAvatar(token: string | null, slot: { current: string | null }) {
  forgetAvatar(slot);
  if (!token) return null;
  const response = await fetch("/api/v1/me/avatar", { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) return null;
  const url = URL.createObjectURL(await response.blob());
  slot.current = url;
  return url;
}

function readPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      resolve(text.slice(text.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new ApiError(400, "invalid_request", "The photo could not be read."));
    reader.readAsDataURL(file);
  });
}

export function paymentLabel(method: PaymentMethod) {
  if (method === "cod") return "Cash on Delivery";
  if (method === "bank") return "Bank Transfer";
  return "Debit / Credit Card";
}

export function paymentStatusLabel(status: string) {
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "cancelled") return "Cancelled";
  if (status === "refunded") return "Refunded";
  if (status === "authorized") return "Authorized";
  return "Pending";
}
