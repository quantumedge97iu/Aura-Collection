import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { Kv } from "../cache/kv";
import { canUseCart, discountFor, type Actor } from "../domain";
import { AppError } from "../http/errors";
import { withActor } from "../db";
import { enqueue } from "../events/outbox";
import { paymentProvider, type PaymentMethod } from "../payments/providers";
import * as repo from "../repositories/commerce";

function camelCart(row: Record<string, unknown>) {
  return {
    variantId: row.variant_id,
    sku: row.sku,
    metal: row.metal,
    size: row.size,
    price: Number(row.price),
    slug: row.slug,
    name: row.name,
    imageUrl: row.image_url,
    quantity: Number(row.quantity),
    available: Number(row.available),
  };
}

function camelOrder(order: Record<string, unknown>) {
  return {
    id: order.id,
    number: order.number,
    customerId: order.customer_id,
    email: order.email,
    status: order.status,
    paymentStatus: order.payment_status,
    fulfillmentStatus: order.fulfillment_status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingFee: Number(order.shipping_fee),
    tax: Number(order.tax),
    total: Number(order.total),
    currency: order.currency,
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    notes: order.notes,
    createdAt: order.created_at,
    items: order.items,
    payment: order.payment,
    shipment: order.shipment,
    history: order.history,
  };
}

export function createCommerceService(pool: pg.Pool, cache: Kv) {
  async function ownedCart(actor: Actor, cartId: string) {
    return withActor(pool, actor, async (db) => {
      const cart = await repo.findCart(db, cartId);
      if (!cart) throw new AppError(404, "not_found", "Cart not found.");
      if (!canUseCart({ customerId: cart.customer_id, guestToken: cart.guest_token }, actor)) {
        throw new AppError(403, "forbidden", "You cannot use this cart.");
      }
      return cart;
    });
  }

  return {
    async openCart(actor: Actor) {
      if (actor.id) {
        const id = await withActor(pool, actor, (db) => repo.customerCart(db, actor.id as string));
        return { id, guestToken: null as string | null };
      }
      const guestToken = actor.cartToken ?? randomUUID();
      const id = await withActor(pool, { ...actor, cartToken: guestToken }, (db) => repo.createGuestCart(db, guestToken));
      return { id, guestToken };
    },
    async getCart(actor: Actor, cartId: string) {
      await ownedCart(actor, cartId);
      const items = await withActor(pool, actor, (db) => repo.cartItems(db, cartId));
      const lines = items.map((row) => camelCart(row as Record<string, unknown>));
      const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
      return { id: cartId, items: lines, subtotal };
    },
    async addItem(actor: Actor, cartId: string, variantId: string, quantity: number) {
      await ownedCart(actor, cartId);
      await withActor(pool, actor, async (db) => {
        const variant = await repo.variantForSale(db, variantId);
        if (!variant || variant.status !== "active" || variant.product_status !== "active") {
          throw new AppError(409, "unavailable", "That piece is not for sale.");
        }
        if (Number(variant.available) < 1) throw new AppError(409, "insufficient_stock", "That piece is no longer available.");
        await repo.addCartItem(db, cartId, variantId, quantity);
      });
      return this.getCart(actor, cartId);
    },
    async setQty(actor: Actor, cartId: string, variantId: string, quantity: number) {
      await ownedCart(actor, cartId);
      await withActor(pool, actor, async (db) => {
        if (quantity === 0) await repo.removeCartItem(db, cartId, variantId);
        else await repo.setCartQty(db, cartId, variantId, quantity);
      });
      return this.getCart(actor, cartId);
    },
    async claim(actor: Actor, token: string) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const id = await withActor(pool, actor, (db) => repo.claimGuestCart(db, token));
      if (!id) throw new AppError(404, "not_found", "Cart not found.");
      return { id };
    },
    async wishlist(actor: Actor) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const items = await withActor(pool, actor, (db) => repo.wishlistItems(db, actor.id as string));
      return { items: items.map((row) => ({ id: row.id, slug: row.slug, name: row.name, imageUrl: row.image_url, price: Number(row.price), metals: Array.isArray(row.metals) ? row.metals : [], defaultVariant: row.default_variant ?? null })) };
    },
    async addWish(actor: Actor, productId: string) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      await withActor(pool, actor, async (db) => {
        const id = await repo.activeProductId(db, productId);
        if (!id) throw new AppError(404, "not_found", "Product not found.");
        await repo.addWish(db, actor.id as string, productId);
      });
    },
    async removeWish(actor: Actor, productId: string) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      await withActor(pool, actor, (db) => repo.removeWish(db, actor.id as string, productId));
    },
    async quoteCoupon(actor: Actor, cartId: string, code: string) {
      await ownedCart(actor, cartId);
      return withActor(pool, actor, async (db) => {
        const coupon = await repo.findCoupon(db, code.toUpperCase());
        if (!coupon) throw new AppError(422, "coupon_rejected", "That coupon cannot be applied.");
        const subtotal = await repo.cartSubtotal(db, cartId);
        try {
          const discount = discountFor(subtotal, { discountType: coupon.discount_type, amount: coupon.amount, minSubtotal: coupon.min_subtotal, maxDiscount: coupon.max_discount });
          return { code: code.toUpperCase(), subtotal, discount, total: subtotal - discount };
        } catch {
          throw new AppError(422, "coupon_rejected", "That coupon cannot be applied.");
        }
      });
    },
    async cities(actor: Actor) {
      const list = await withActor(pool, actor, repo.cities);
      return list.map((row) => ({ city: row.city, province: row.province, transitDays: row.transit_days, fee: Number(row.fee) }));
    },
    async checkout(actor: Actor, input: { cartId: string; email: string; shipping: { name: string; phone: string; city: string; address: string; notes?: string }; method: PaymentMethod; coupon?: string | null; cardLast4?: string | null; idempotencyKey: string }) {
      const prepared = paymentProvider(input.method).prepare({ cardLast4: input.cardLast4 });
      const cacheKey = `idem:checkout:${actor.id ?? actor.cartToken ?? input.cartId}:${input.idempotencyKey}`;
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached) as Record<string, unknown>;
      await ownedCart(actor, input.cartId);
      const order = await withActor(pool, actor, async (db) => {
        const id = await repo.placeOrder(db, {
          cartId: input.cartId,
          email: input.email,
          shipping: { ...input.shipping, notes: input.shipping.notes ?? "" },
          method: prepared.method,
          idempotencyKey: input.idempotencyKey,
          coupon: input.coupon ? input.coupon.toUpperCase() : null,
          cardLast4: prepared.cardLast4,
        });
        const loaded = await repo.orderById(db, id);
        if (!loaded) throw new AppError(500, "internal", "The order could not be loaded.");
        const row = loaded as unknown as { number: string; email: string; total: string | number; currency: string };
        await enqueue(db, {
          name: "order.created.v1",
          aggregateId: id,
          dedupeKey: `order.created.v1:${id}`,
          payload: { orderId: id, number: row.number, email: row.email, total: Number(row.total), currency: row.currency, method: prepared.method },
        });
        return camelOrder(loaded as Record<string, unknown>);
      });
      await cache.set(cacheKey, JSON.stringify(order), 24 * 60 * 60 * 1000);
      return order;
    },
    async orders(actor: Actor) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const list = await withActor(pool, actor, (db) => repo.ordersForCustomer(db, actor.id as string, 24));
      return { items: list.map((row) => ({ id: row.id, number: row.number, status: row.status, paymentStatus: row.payment_status, total: Number(row.total), currency: row.currency, createdAt: row.created_at, city: row.city, method: row.method })) };
    },
    async order(actor: Actor, id: string) {
      const order = await withActor(pool, actor, (db) => repo.orderById(db, id));
      if (!order) throw new AppError(404, "not_found", "Order not found.");
      const view = camelOrder(order as Record<string, unknown>);
      if (actor.role === "guest" || (view.customerId && view.customerId !== actor.id && actor.role === "customer")) {
        throw new AppError(404, "not_found", "Order not found.");
      }
      if (!view.customerId && actor.role === "customer") throw new AppError(404, "not_found", "Order not found.");
      return view;
    },
    async lookup(actor: Actor, number: string, email: string) {
      const order = await withActor(pool, actor, (db) => repo.orderByNumber(db, number, email));
      if (!order) throw new AppError(404, "not_found", "Order not found.");
      return camelOrder(order as Record<string, unknown>);
    },
    async cancel(actor: Actor, id: string, reason: string) {
      await withActor(pool, actor, async (db) => {
        await repo.cancelOrder(db, id, reason);
        const loaded = await repo.orderById(db, id);
        const row = loaded as { number?: string; email?: string } | null;
        await enqueue(db, {
          name: "order.cancelled.v1",
          aggregateId: id,
          dedupeKey: `order.cancelled.v1:${id}`,
          payload: { orderId: id, number: row?.number ?? null, email: row?.email ?? null, reason },
        });
      });
      return this.order(actor, id);
    },
    async reserve(actor: Actor, input: { cartId: string; variantId: string; quantity: number; idempotencyKey: string }) {
      await ownedCart(actor, input.cartId);
      const id = await withActor(pool, actor, (db) => repo.reserve(db, input.variantId, input.quantity, input.idempotencyKey, input.cartId));
      return { id };
    },
    async release(actor: Actor, reservationId: string) {
      await withActor(pool, actor, (db) => repo.release(db, reservationId));
    },
    async availability(actor: Actor, variantId: string) {
      const found = await withActor(pool, actor, (db) => repo.available(db, variantId));
      if (!found) throw new AppError(404, "not_found", "Inventory record not found.");
      return { variantId, sku: found.sku, available: Number(found.available) };
    },
    async reviews(actor: Actor, slug: string) {
      return withActor(pool, actor, async (db) => {
        const productId = await repo.productIdBySlug(db, slug);
        if (!productId) throw new AppError(404, "not_found", "Product not found.");
        const items = await repo.reviewsForProduct(db, productId);
        return { items: items.map((row) => ({ id: row.id, rating: row.rating, title: row.title, body: row.body, verified: row.verified, createdAt: row.created_at, name: row.full_name })) };
      });
    },
    async addReview(actor: Actor, slug: string, input: { rating: number; title: string; body: string }) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      return withActor(pool, actor, async (db) => {
        const productId = await repo.productIdBySlug(db, slug);
        if (!productId) throw new AppError(404, "not_found", "Product not found.");
        const created = await repo.addReview(db, productId, actor.id as string, input.rating, input.title, input.body);
        return { id: created.id, status: created.status };
      });
    },
    async me(actor: Actor) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const row = await withActor(pool, actor, (db) => repo.profile(db, actor.id as string));
      if (!row) throw new AppError(404, "not_found", "Profile not found.");
      return { id: row.id, fullName: row.full_name, phone: row.phone, avatarUrl: row.avatar_url, status: row.status, role: row.role, email: actor.email };
    },
    async updateMe(actor: Actor, input: { fullName: string; phone: string | null }) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      await withActor(pool, actor, (db) => repo.updateProfile(db, actor.id as string, input.fullName, input.phone));
      return this.me(actor);
    },
    async addresses(actor: Actor) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const list = await withActor(pool, actor, (db) => repo.addresses(db, actor.id as string));
      return { items: list.map(camelAddress) };
    },
    async addAddress(actor: Actor, input: Record<string, unknown>) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const id = await withActor(pool, actor, (db) => repo.insertAddress(db, actor.id as string, input));
      return { id };
    },
    async removeAddress(actor: Actor, addressId: string) {
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const removed = await withActor(pool, actor, (db) => repo.deleteAddress(db, actor.id as string, addressId));
      if (!removed) throw new AppError(404, "not_found", "Address not found.");
    },
    async subscribeNewsletter(actor: Actor, email: string) {
      const row = await withActor(pool, actor, (db) => repo.subscribeNewsletter(db, email));
      return { ok: true, email: row.email };
    },
  };
}

function camelAddress(row: Record<string, unknown>) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    isDefaultShipping: row.is_default_shipping,
    isDefaultBilling: row.is_default_billing,
  };
}
