export type AppRole = "customer" | "staff" | "manager" | "admin";

export type Actor = {
  id: string | null;
  role: AppRole | "guest";
  jwtRole: "anon" | "authenticated" | "service_role";
  cartToken: string | null;
  email: string | null;
};

/** Background worker. service_role is the system caller, not a staff login. */
export const systemActor: Actor = {
  id: null,
  role: "guest",
  jwtRole: "service_role",
  cartToken: null,
  email: null,
};

export type Profile = {
  id: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  role: AppRole;
  email: string | null;
};

const rank: Record<AppRole, number> = { customer: 0, staff: 1, manager: 2, admin: 3 };

export function hasRole(role: AppRole, minimum: AppRole) {
  return rank[role] >= rank[minimum];
}

export function canUseCart(cart: { customerId: string | null; guestToken: string | null }, actor: Actor) {
  if (actor.jwtRole === "service_role") return true;
  if (cart.customerId && cart.customerId === actor.id) return true;
  return !cart.customerId && !!cart.guestToken && cart.guestToken === actor.cartToken;
}

export function canReadOrder(order: { customerId: string | null }, actor: Actor) {
  if (actor.role === "staff" || actor.role === "manager" || actor.role === "admin") return true;
  return !!order.customerId && order.customerId === actor.id;
}

export type CouponQuote = {
  discountType: "percent" | "fixed";
  amount: number;
  minSubtotal: number;
  maxDiscount: number | null;
};

export function discountFor(subtotal: number, coupon: CouponQuote) {
  if (subtotal < coupon.minSubtotal) {
    throw new Error("minimum");
  }
  const raw = coupon.discountType === "percent" ? Math.floor((subtotal * coupon.amount) / 100) : coupon.amount;
  const capped = coupon.maxDiscount == null ? raw : Math.min(raw, coupon.maxDiscount);
  return Math.min(capped, subtotal);
}

export function catalogCacheKey(version: number, name: string, query: unknown) {
  return `catalog:${version}:${name}:${JSON.stringify(query)}`;
}
