import type pg from "pg";
import type { Actor } from "../domain";
import { hasRole } from "../domain";
import { AppError } from "../http/errors";
import { withActor } from "../db";
import { enqueue } from "../events/outbox";
import * as admin from "../repositories/admin";

function staff(actor: Actor) {
  if (actor.role === "guest" || !hasRole(actor.role, "staff")) throw new AppError(403, "forbidden", "Staff access is required.");
}

function manager(actor: Actor) {
  if (actor.role === "guest" || !hasRole(actor.role, "manager")) throw new AppError(403, "forbidden", "Manager access is required.");
}

function adminOnly(actor: Actor) {
  if (actor.role !== "admin") throw new AppError(403, "forbidden", "Admin access is required.");
}

export function createAdminService(pool: pg.Pool) {
  return {
    async orders(actor: Actor, status: string | null, limit: number) {
      staff(actor);
      const items = await withActor(pool, actor, (db) => admin.listOrders(db, status, limit));
      return { items };
    },
    async setStatus(actor: Actor, orderId: string, status: string, reason: string) {
      staff(actor);
      await withActor(pool, actor, (db) => admin.setOrderStatus(db, orderId, status, reason));
    },
    async adjust(actor: Actor, variantId: string, type: string, delta: number, note: string) {
      staff(actor);
      await withActor(pool, actor, (db) => admin.adjustInventory(db, variantId, type, delta, note));
    },
    async expire(actor: Actor) {
      staff(actor);
      const released = await withActor(pool, actor, admin.expireReservations);
      return { released };
    },
    async payment(actor: Actor, paymentId: string, status: string, providerRef: string | null) {
      manager(actor);
      const updated = await withActor(pool, actor, async (db) => {
        const payment = await admin.setPayment(db, paymentId, status, providerRef);
        if (!payment) return false;
        await enqueue(db, {
          name: "payment.updated.v1",
          aggregateId: paymentId,
          dedupeKey: `payment.updated.v1:${paymentId}:${status}`,
          payload: { paymentId, orderId: payment.orderId, status, providerRef },
        });
        return true;
      });
      if (!updated) throw new AppError(404, "not_found", "Payment not found.");
    },
    async review(actor: Actor, reviewId: string, status: string) {
      staff(actor);
      const updated = await withActor(pool, actor, (db) => admin.setReviewStatus(db, reviewId, status));
      if (!updated) throw new AppError(404, "not_found", "Review not found.");
    },
    async coupon(actor: Actor, input: { code: string; discountType: "percent" | "fixed"; amount: number; minSubtotal: number; maxDiscount: number | null; usageLimit: number | null; perCustomerLimit: number }) {
      manager(actor);
      await withActor(pool, actor, (db) => admin.createCoupon(db, input));
    },
    async audit(actor: Actor, entity: string | null, limit: number) {
      adminOnly(actor);
      const items = await withActor(pool, actor, (db) => admin.audit(db, entity, limit));
      return { items };
    },
    async customers(actor: Actor, limit: number) {
      staff(actor);
      const items = await withActor(pool, actor, (db) => admin.customers(db, limit));
      return { items };
    },
    async setRole(actor: Actor, profileId: string, role: string) {
      adminOnly(actor);
      const updated = await withActor(pool, actor, (db) => admin.setRole(db, profileId, role));
      if (!updated) throw new AppError(404, "not_found", "Profile not found.");
      return updated;
    },
    async createProduct(actor: Actor, input: Parameters<typeof admin.createProduct>[2]) {
      manager(actor);
      if (!actor.id) throw new AppError(401, "unauthorized", "Sign in again.");
      const id = await withActor(pool, actor, (db) => admin.createProduct(db, actor.id as string, input));
      if (!id) throw new AppError(400, "invalid_request", "Brand or category was not found.");
      return { id };
    },
    async updateProduct(actor: Actor, slug: string, patch: { name?: string; description?: string; status?: string }) {
      manager(actor);
      const updated = await withActor(pool, actor, (db) => admin.updateProduct(db, slug, patch));
      if (!updated) throw new AppError(404, "not_found", "Product not found.");
      return updated;
    },
    async variantCost(actor: Actor, variantId: string) {
      manager(actor);
      const variant = await withActor(pool, actor, (db) => admin.variantCost(db, variantId));
      if (!variant) throw new AppError(404, "not_found", "Variant not found.");
      return variant;
    },
  };
}
