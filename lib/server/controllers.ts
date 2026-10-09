import type { Actor } from "./domain";
import { AppError } from "./http/errors";
import { parse, schemas } from "./http/parse";
import type { createAdminService } from "./services/admin";
import type { createAuthService } from "./services/auth";
import type { createCatalogService } from "./services/catalog";
import type { createCommerceService } from "./services/commerce";

export type Services = {
  catalog: ReturnType<typeof createCatalogService>;
  commerce: ReturnType<typeof createCommerceService>;
  admin: ReturnType<typeof createAdminService>;
  auth: ReturnType<typeof createAuthService>;
};

export type Ctx = {
  actor: Actor;
  body: unknown;
  query: unknown;
  params: Record<string, string>;
  header(name: string): string | undefined;
};

function key(ctx: Ctx) {
  const value = ctx.header("idempotency-key");
  if (!value || value.length < 8) throw new AppError(400, "invalid_request", "Send an Idempotency-Key of at least 8 characters.");
  return value;
}

export const controllers = {
  async health(ctx: Ctx, services: Services, ping: () => Promise<string>) {
    void ctx;
    void services;
    return { ok: true, cache: await ping() };
  },
  async products(ctx: Ctx, services: Services) {
    const query = parse(schemas.list, ctx.query);
    return services.catalog.list(ctx.actor, {
      category: query.category ?? null,
      tag: query.tag ?? null,
      metal: query.metal ?? null,
      limit: query.limit ?? 24,
      cursor: query.cursor ?? null,
      minPrice: query.minPrice ?? null,
      maxPrice: query.maxPrice ?? null,
      sort: query.sort ?? null,
    });
  },
  async search(ctx: Ctx, services: Services) {
    const query = parse(schemas.search, ctx.query);
    return services.catalog.search(ctx.actor, query.q, query.limit ?? 24);
  },
  async product(ctx: Ctx, services: Services) {
    const params = parse(schemas.slug, ctx.params);
    const product = await services.catalog.detail(ctx.actor, params.slug);
    if (!product) throw new AppError(404, "not_found", "Product not found.");
    return product;
  },
  async categories(ctx: Ctx, services: Services) {
    return services.catalog.categories(ctx.actor);
  },
  async brands(ctx: Ctx, services: Services) {
    return services.catalog.brands(ctx.actor);
  },
  async recentReviews(ctx: Ctx, services: Services) {
    const limit = Number((ctx.query as { limit?: string }).limit ?? 12);
    return { items: await services.catalog.recentReviews(ctx.actor, Number.isFinite(limit) ? Math.min(24, Math.max(1, limit)) : 12) };
  },
  async collections(ctx: Ctx, services: Services) {
    return services.catalog.collections(ctx.actor);
  },
  async collection(ctx: Ctx, services: Services) {
    const params = parse(schemas.slug, ctx.params);
    const collection = await services.catalog.collection(ctx.actor, params.slug);
    if (!collection) throw new AppError(404, "not_found", "Collection not found.");
    return collection;
  },
  async reviews(ctx: Ctx, services: Services) {
    return services.commerce.reviews(ctx.actor, parse(schemas.slug, ctx.params).slug);
  },
  async addReview(ctx: Ctx, services: Services) {
    const review = parse(schemas.review, ctx.body);
    return services.commerce.addReview(ctx.actor, parse(schemas.slug, ctx.params).slug, { rating: review.rating, title: review.title ?? "", body: review.body });
  },
  async cities(ctx: Ctx, services: Services) {
    return { items: await services.commerce.cities(ctx.actor) };
  },
  async availability(ctx: Ctx, services: Services) {
    return services.commerce.availability(ctx.actor, parse(schemas.id, ctx.params).id);
  },
  async openCart(ctx: Ctx, services: Services) {
    return services.commerce.openCart(ctx.actor);
  },
  async cart(ctx: Ctx, services: Services) {
    return services.commerce.getCart(ctx.actor, parse(schemas.id, ctx.params).id);
  },
  async addItem(ctx: Ctx, services: Services) {
    const body = parse(schemas.cartItem, ctx.body);
    return services.commerce.addItem(ctx.actor, parse(schemas.id, ctx.params).id, body.variantId, body.quantity ?? 1);
  },
  async setQty(ctx: Ctx, services: Services) {
    const body = parse(schemas.qty, ctx.body);
    return services.commerce.setQty(ctx.actor, parse(schemas.id, ctx.params).id, parse(schemas.id, { id: ctx.params.variantId }).id, body.quantity);
  },
  async claim(ctx: Ctx, services: Services) {
    return services.commerce.claim(ctx.actor, parse(schemas.claim, ctx.body).token);
  },
  async wishlist(ctx: Ctx, services: Services) {
    return services.commerce.wishlist(ctx.actor);
  },
  async addWish(ctx: Ctx, services: Services) {
    await services.commerce.addWish(ctx.actor, parse(schemas.wish, ctx.body).productId);
    return { ok: true };
  },
  async removeWish(ctx: Ctx, services: Services) {
    await services.commerce.removeWish(ctx.actor, parse(schemas.id, ctx.params).id);
    return { ok: true };
  },
  async quote(ctx: Ctx, services: Services) {
    const body = parse(schemas.coupon, ctx.body);
    return services.commerce.quoteCoupon(ctx.actor, body.cartId, body.code);
  },
  async checkout(ctx: Ctx, services: Services) {
    const body = parse(schemas.checkout, ctx.body);
    return services.commerce.checkout(ctx.actor, { ...body, idempotencyKey: key(ctx) });
  },
  async reserve(ctx: Ctx, services: Services) {
    return services.commerce.reserve(ctx.actor, parse(schemas.reserve, ctx.body));
  },
  async release(ctx: Ctx, services: Services) {
    await services.commerce.release(ctx.actor, parse(schemas.id, ctx.params).id);
    return { ok: true };
  },
  async orders(ctx: Ctx, services: Services) {
    return services.commerce.orders(ctx.actor);
  },
  async order(ctx: Ctx, services: Services) {
    return services.commerce.order(ctx.actor, parse(schemas.id, ctx.params).id);
  },
  async lookup(ctx: Ctx, services: Services) {
    const query = parse(schemas.lookup, ctx.query);
    return services.commerce.lookup(ctx.actor, query.number, query.email);
  },
  async cancel(ctx: Ctx, services: Services) {
    const body = parse(schemas.cancel, ctx.body ?? {});
    return services.commerce.cancel(ctx.actor, parse(schemas.id, ctx.params).id, body.reason ?? "");
  },
  async me(ctx: Ctx, services: Services) {
    return services.commerce.me(ctx.actor);
  },
  async updateMe(ctx: Ctx, services: Services) {
    const body = parse(schemas.profile, ctx.body);
    return services.commerce.updateMe(ctx.actor, { fullName: body.fullName, phone: body.phone ?? null });
  },
  async addresses(ctx: Ctx, services: Services) {
    return services.commerce.addresses(ctx.actor);
  },
  async addAddress(ctx: Ctx, services: Services) {
    return services.commerce.addAddress(ctx.actor, parse(schemas.address, ctx.body));
  },
  async removeAddress(ctx: Ctx, services: Services) {
    await services.commerce.removeAddress(ctx.actor, parse(schemas.id, ctx.params).id);
    return { ok: true };
  },
  async subscribeNewsletter(ctx: Ctx, services: Services) {
    const body = parse(schemas.newsletter, ctx.body);
    return services.commerce.subscribeNewsletter(ctx.actor, body.email);
  },
  async login(ctx: Ctx, services: Services) {
    const body = parse(schemas.credentials, ctx.body);
    return services.auth.login(body.email, body.password);
  },
  async register(ctx: Ctx, services: Services) {
    const body = parse(schemas.credentials, ctx.body);
    if (!body.fullName) throw new AppError(400, "invalid_request", "Enter your name.");
    return services.auth.register(body.email, body.password, body.fullName, ctx.header("origin"));
  },
  async resend(ctx: Ctx, services: Services) {
    const body = parse(schemas.resend, ctx.body);
    return services.auth.resend(body.email, ctx.header("origin"));
  },
  async forgot(ctx: Ctx, services: Services) {
    const body = parse(schemas.resend, ctx.body);
    return services.auth.forgot(body.email, ctx.header("origin"));
  },
  async resetPassword(ctx: Ctx, services: Services) {
    const body = parse(schemas.resetPassword, ctx.body);
    const header = ctx.header("authorization") ?? "";
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (!token || token === header.trim()) throw new AppError(401, "unauthorized", "This reset link is missing or has expired.");
    return services.auth.reset(token, body.password);
  },
  async adminOrders(ctx: Ctx, services: Services) {
    const query = parse(schemas.orders, ctx.query);
    return services.admin.orders(ctx.actor, query.status ?? null, query.limit ?? 24);
  },
  async adminStatus(ctx: Ctx, services: Services) {
    const body = parse(schemas.status, ctx.body);
    await services.admin.setStatus(ctx.actor, parse(schemas.id, ctx.params).id, body.status, body.reason ?? "");
    return { ok: true };
  },
  async adjust(ctx: Ctx, services: Services) {
    const body = parse(schemas.adjust, ctx.body);
    await services.admin.adjust(ctx.actor, body.variantId, body.type, body.delta, body.note ?? "");
    return { ok: true };
  },
  async expire(ctx: Ctx, services: Services) {
    return services.admin.expire(ctx.actor);
  },
  async payment(ctx: Ctx, services: Services) {
    const body = parse(schemas.payment, ctx.body);
    await services.admin.payment(ctx.actor, parse(schemas.id, ctx.params).id, body.status, body.providerRef ?? null);
    return { ok: true };
  },
  async moderate(ctx: Ctx, services: Services) {
    const body = parse(schemas.reviewStatus, ctx.body);
    await services.admin.review(ctx.actor, parse(schemas.id, ctx.params).id, body.status);
    return { ok: true };
  },
  async createCoupon(ctx: Ctx, services: Services) {
    const body = parse(schemas.couponCreate, ctx.body);
    await services.admin.coupon(ctx.actor, { ...body, minSubtotal: body.minSubtotal ?? 0, maxDiscount: body.maxDiscount ?? null, usageLimit: body.usageLimit ?? null, perCustomerLimit: body.perCustomerLimit ?? 1 });
    return { ok: true };
  },
  async audit(ctx: Ctx, services: Services) {
    const query = parse(schemas.audit, ctx.query);
    return services.admin.audit(ctx.actor, query.entity ?? null, query.limit ?? 50);
  },
  async customers(ctx: Ctx, services: Services) {
    const query = parse(schemas.audit, ctx.query);
    return services.admin.customers(ctx.actor, query.limit ?? 50);
  },
  async role(ctx: Ctx, services: Services) {
    return services.admin.setRole(ctx.actor, parse(schemas.id, ctx.params).id, parse(schemas.role, ctx.body).role);
  },
  async createProduct(ctx: Ctx, services: Services) {
    const product = parse(schemas.product, ctx.body);
    return services.admin.createProduct(ctx.actor, { ...product, description: product.description ?? "" });
  },
  async updateProduct(ctx: Ctx, services: Services) {
    return services.admin.updateProduct(ctx.actor, parse(schemas.slug, ctx.params).slug, parse(schemas.productPatch, ctx.body));
  },
  async cost(ctx: Ctx, services: Services) {
    return services.admin.variantCost(ctx.actor, parse(schemas.id, ctx.params).id);
  },
};
