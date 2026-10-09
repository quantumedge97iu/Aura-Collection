import { z } from "zod";
import { AppError } from "./errors";

export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(400, "invalid_request", "The request could not be accepted.", result.error.flatten());
  return result.data;
}

const shipping = z.object({
  name: z.string().trim().min(3),
  phone: z.string().trim().min(7),
  city: z.string().trim().min(2),
  address: z.string().trim().min(4),
  notes: z.string().optional(),
});

export const schemas = {
  list: z.object({
    category: z.string().trim().min(1).optional(),
    tag: z.enum(["new", "bestseller", "gift"]).optional(),
    metal: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(48).default(24),
    cursor: z.string().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(["featured", "price-asc", "price-desc", "rating"]).optional(),
  }),
  search: z.object({ q: z.string().trim().min(1).max(80), limit: z.coerce.number().int().min(1).max(48).default(24) }),
  subscribe: z.object({ email: z.string().trim().email().max(160) }),
  contact: z.object({ name: z.string().trim().min(3).max(80), email: z.string().trim().email().max(160), message: z.string().trim().min(10).max(2000) }),
  slug: z.object({ slug: z.string().trim().min(1) }),
  id: z.object({ id: z.string().uuid() }),
  cartItem: z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(8).default(1) }),
  qty: z.object({ quantity: z.number().int().min(0).max(8) }),
  claim: z.object({ token: z.string().uuid() }),
  wish: z.object({ productId: z.string().uuid() }),
  coupon: z.object({ cartId: z.string().uuid(), code: z.string().trim().min(4).max(32) }),
  checkout: z.object({
    cartId: z.string().uuid(),
    email: z.string().trim().email(),
    shipping,
    method: z.enum(["cod", "bank", "card"]),
    coupon: z.string().trim().min(4).max(32).optional(),
    cardLast4: z.string().regex(/^[0-9]{4}$/).optional(),
  }),
  lookup: z.object({ number: z.string().trim().min(4), email: z.string().trim().email() }),
  cancel: z.object({ reason: z.string().trim().max(400).optional() }),
  reserve: z.object({ cartId: z.string().uuid(), variantId: z.string().uuid(), quantity: z.number().int().min(1).max(8), idempotencyKey: z.string().min(8) }),
  review: z.object({ rating: z.number().int().min(1).max(5), title: z.string().trim().max(120).default(""), body: z.string().trim().min(4).max(2000) }),
  profile: z.object({ fullName: z.string().trim().min(3), phone: z.string().trim().min(7).nullable().optional() }),
  avatar: z.object({ mime: z.enum(["image/jpeg", "image/png", "image/webp"]), data: z.string().min(32).max(1_800_000) }),
  address: z.object({
    fullName: z.string().trim().min(3),
    phone: z.string().trim().min(7),
    line1: z.string().trim().min(4),
    line2: z.string().optional(),
    city: z.string().trim().min(2),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().trim().length(2).default("PK"),
    isDefaultShipping: z.boolean().optional(),
    isDefaultBilling: z.boolean().optional(),
  }),
  credentials: z.object({ email: z.string().trim().email(), password: z.string().min(6), fullName: z.string().trim().min(3).optional() }),
  resend: z.object({ email: z.string().trim().email() }),
  resetPassword: z.object({ password: z.string().min(6).max(72) }),
  status: z.object({ status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"]), reason: z.string().max(400).optional() }),
  adjust: z.object({ variantId: z.string().uuid(), type: z.enum(["purchase", "restock", "adjustment", "return", "damage", "manual_correction"]), delta: z.number().int().refine((value) => value !== 0), note: z.string().max(400).optional() }),
  payment: z.object({ status: z.enum(["pending", "authorized", "paid", "failed", "refunded", "cancelled"]), providerRef: z.string().min(1).max(120).optional() }),
  reviewStatus: z.object({ status: z.enum(["pending", "published", "rejected"]) }),
  couponCreate: z.object({
    code: z.string().trim().regex(/^[A-Z0-9-]{4,32}$/),
    discountType: z.enum(["percent", "fixed"]),
    amount: z.number().int().positive(),
    minSubtotal: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    perCustomerLimit: z.number().int().positive().default(1),
  }),
  role: z.object({ role: z.enum(["customer", "staff", "manager", "admin"]) }),
  product: z.object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().trim().min(2),
    description: z.string().default(""),
    sku: z.string().trim().min(3),
    productType: z.string().trim().min(2),
    categorySlug: z.string().trim().min(2),
    imageUrl: z.string().optional(),
    variants: z.array(z.object({
      sku: z.string().trim().min(3),
      metal: z.string().trim().min(1),
      size: z.string().trim().min(1),
      price: z.number().int().min(0),
      stock: z.number().int().min(0),
    })).min(1),
  }),
  productPatch: z.object({ name: z.string().trim().min(2).optional(), description: z.string().optional(), status: z.enum(["draft", "active", "archived"]).optional() }),
  audit: z.object({ entity: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }),
  orders: z.object({ status: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(24) }),
};
