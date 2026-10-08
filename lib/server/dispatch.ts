import { randomUUID } from "node:crypto";
import type pg from "pg";
import { MemoryKv, RedisKv, type Kv } from "./cache/kv";
import { assertRuntime, loadConfig, type Config } from "./config";
import { controllers, type Ctx, type Services } from "./controllers";
import { createPool } from "./db";
import { AppError, mapDbError } from "./http/errors";
import { openApiDocument, type RouteDoc } from "./openapi";
import { createAdminService } from "./services/admin";
import { createAuthService } from "./services/auth";
import { createCatalogService } from "./services/catalog";
import { createCommerceService } from "./services/commerce";

type Handler = (ctx: Ctx, services: Services) => Promise<unknown>;

const routes: Array<RouteDoc & { limit?: number; handler: Handler }> = [
  { method: "GET", path: "/health", auth: "public", summary: "Database and cache health", handler: controllers.products },
  { method: "GET", path: "/v1/products", auth: "public", summary: "List active products", handler: controllers.products },
  { method: "GET", path: "/v1/search", auth: "public", summary: "Search the catalog", handler: controllers.search },
  { method: "GET", path: "/v1/products/:slug", auth: "public", summary: "Product detail with live availability", handler: controllers.product },
  { method: "GET", path: "/v1/categories", auth: "public", summary: "Category navigation", handler: controllers.categories },
  { method: "GET", path: "/v1/brands", auth: "public", summary: "Brands", handler: controllers.brands },
  { method: "GET", path: "/v1/reviews", auth: "public", summary: "Recent published reviews", handler: controllers.recentReviews },
  { method: "GET", path: "/v1/collections", auth: "public", summary: "Collections", handler: controllers.collections },
  { method: "GET", path: "/v1/collections/:slug", auth: "public", summary: "One collection", handler: controllers.collection },
  { method: "GET", path: "/v1/products/:slug/reviews", auth: "public", summary: "Published reviews", handler: controllers.reviews },
  { method: "POST", path: "/v1/products/:slug/reviews", auth: "customer", summary: "Write a review", handler: controllers.addReview },
  { method: "GET", path: "/v1/shipping/cities", auth: "public", summary: "Deliverable cities and fees", handler: controllers.cities },
  { method: "GET", path: "/v1/inventory/:id", auth: "public", summary: "Live available quantity", handler: controllers.availability },
  { method: "POST", path: "/v1/carts", auth: "public", summary: "Open a guest or customer cart", handler: controllers.openCart },
  { method: "POST", path: "/v1/carts/claim", auth: "customer", summary: "Attach a guest cart to the signed-in customer", handler: controllers.claim },
  { method: "GET", path: "/v1/carts/:id", auth: "public", summary: "Read a cart you own", handler: controllers.cart },
  { method: "POST", path: "/v1/carts/:id/items", auth: "public", summary: "Add a variant", handler: controllers.addItem },
  { method: "PATCH", path: "/v1/carts/:id/items/:variantId", auth: "public", summary: "Set a line quantity", handler: controllers.setQty },
  { method: "GET", path: "/v1/wishlist", auth: "customer", summary: "Read your wishlist", handler: controllers.wishlist },
  { method: "POST", path: "/v1/wishlist", auth: "customer", summary: "Save a product", handler: controllers.addWish },
  { method: "DELETE", path: "/v1/wishlist/:id", auth: "customer", summary: "Remove a product", handler: controllers.removeWish },
  { method: "POST", path: "/v1/coupons/quote", auth: "public", summary: "Estimate a coupon from database prices", handler: controllers.quote },
  { method: "POST", path: "/v1/checkout", auth: "public", summary: "Place an order from database prices and stock", limit: 30, handler: controllers.checkout },
  { method: "POST", path: "/v1/inventory/reservations", auth: "public", summary: "Hold stock", handler: controllers.reserve },
  { method: "POST", path: "/v1/inventory/reservations/:id/release", auth: "public", summary: "Release a hold", handler: controllers.release },
  { method: "GET", path: "/v1/orders", auth: "customer", summary: "Your orders", handler: controllers.orders },
  { method: "GET", path: "/v1/orders/lookup", auth: "public", summary: "Guest order lookup by number and email", handler: controllers.lookup },
  { method: "GET", path: "/v1/orders/:id", auth: "customer", summary: "One order", handler: controllers.order },
  { method: "POST", path: "/v1/orders/:id/cancel", auth: "customer", summary: "Cancel an unpaid order", handler: controllers.cancel },
  { method: "GET", path: "/v1/me", auth: "customer", summary: "Your profile", handler: controllers.me },
  { method: "PATCH", path: "/v1/me", auth: "customer", summary: "Update your profile", handler: controllers.updateMe },
  { method: "GET", path: "/v1/me/addresses", auth: "customer", summary: "Your addresses", handler: controllers.addresses },
  { method: "POST", path: "/v1/me/addresses", auth: "customer", summary: "Add an address", handler: controllers.addAddress },
  { method: "DELETE", path: "/v1/me/addresses/:id", auth: "customer", summary: "Remove an address", handler: controllers.removeAddress },
  { method: "POST", path: "/v1/auth/login", auth: "public", summary: "Sign in with Supabase Auth", handler: controllers.login },
  { method: "POST", path: "/v1/auth/register", auth: "public", summary: "Create a Supabase Auth user and send a confirmation email", handler: controllers.register },
  { method: "POST", path: "/v1/auth/resend", auth: "public", summary: "Resend the signup confirmation email", handler: controllers.resend },
  { method: "POST", path: "/v1/auth/forgot", auth: "public", summary: "Email a password reset link", handler: controllers.forgot },
  { method: "POST", path: "/v1/auth/reset", auth: "public", summary: "Set a new password from a reset link", handler: controllers.resetPassword },
  { method: "GET", path: "/v1/admin/orders", auth: "staff", summary: "Order queue", handler: controllers.adminOrders },
  { method: "POST", path: "/v1/admin/orders/:id/status", auth: "staff", summary: "Move an order status", handler: controllers.adminStatus },
  { method: "POST", path: "/v1/admin/inventory/adjust", auth: "staff", summary: "Adjust stock through the ledger", handler: controllers.adjust },
  { method: "POST", path: "/v1/admin/inventory/expire", auth: "staff", summary: "Release expired holds", handler: controllers.expire },
  { method: "POST", path: "/v1/admin/payments/:id", auth: "manager", summary: "Record a payment status", handler: controllers.payment },
  { method: "POST", path: "/v1/admin/reviews/:id", auth: "staff", summary: "Moderate a review", handler: controllers.moderate },
  { method: "POST", path: "/v1/admin/coupons", auth: "manager", summary: "Create a coupon", handler: controllers.createCoupon },
  { method: "GET", path: "/v1/admin/audit", auth: "admin", summary: "Audit log", handler: controllers.audit },
  { method: "GET", path: "/v1/admin/customers", auth: "staff", summary: "Customers", handler: controllers.customers },
  { method: "POST", path: "/v1/admin/customers/:id/role", auth: "admin", summary: "Change a role", handler: controllers.role },
  { method: "POST", path: "/v1/admin/products", auth: "manager", summary: "Create a product and its stock", handler: controllers.createProduct },
  { method: "PATCH", path: "/v1/admin/products/:slug", auth: "manager", summary: "Update a product", handler: controllers.updateProduct },
  { method: "GET", path: "/v1/admin/variants/:id", auth: "manager", summary: "Variant including cost", handler: controllers.cost },
];

export type Runtime = {
  config: Config;
  pool: pg.Pool;
  cache: Kv;
  services: Services;
};

const globalStore = globalThis as unknown as { luxeRuntime?: Runtime };

export function createRuntime(config: Config, pool: pg.Pool, cache: Kv): Runtime {
  return {
    config,
    pool,
    cache,
    services: {
      catalog: createCatalogService(pool, cache),
      commerce: createCommerceService(pool, cache),
      admin: createAdminService(pool),
      auth: createAuthService(pool, config),
    },
  };
}

export function getRuntime() {
  const config = loadConfig();
  assertRuntime(config);
  const current = globalStore.luxeRuntime;
  const samePool = current?.config.databaseUrl === config.databaseUrl && current?.config.redisUrl === config.redisUrl;
  const sameAuth = current?.config.supabaseUrl === config.supabaseUrl
    && current?.config.supabaseAnonKey === config.supabaseAnonKey
    && current?.config.supabaseServiceRoleKey === config.supabaseServiceRoleKey
    && current?.config.jwtSecret === config.jwtSecret;
  if (!current || !samePool || !sameAuth) {
    if (!config.databaseUrl) throw new Error("DATABASE_URL is required");
    if (!config.jwtSecret) throw new Error("JWT_SECRET is required");
    if (current && !samePool) void current.pool.end();
    const cache = samePool && current ? current.cache : config.redisUrl ? RedisKv.connect(config.redisUrl) : new MemoryKv();
    const pool = samePool && current ? current.pool : createPool(config.databaseUrl);
    if (!samePool && !config.redisUrl) console.warn(JSON.stringify({ msg: "REDIS_URL is unset. Catalog cache and rate limits stay in this process." }));
    const runtime = createRuntime(config, pool, cache);
    globalStore.luxeRuntime = runtime;
    return runtime;
  }
  return current;
}

export async function dispatch(request: Request, runtime: Runtime = getRuntime()) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  try {
    if (request.method === "OPTIONS") return json(204, null, requestId);
    const url = new URL(request.url);
    const pathname = normalize(url.pathname);
    const ip = clientIp(request);
    const count = await runtime.cache.incr(`rl:${ip}:${request.method}:${pathname}`, 60_000);
    if (count > runtime.config.rateLimitPerMinute) throw new AppError(429, "rate_limited", "Too many requests.");

    if (request.method === "GET" && pathname === "/v1/openapi.json") {
      return json(200, openApiDocument(routes.filter((route) => route.path !== "/health").map(({ method, path, summary, auth }) => ({ method, path, summary, auth }))), requestId);
    }

    const found = match(request.method, pathname);
    if (!found) return json(404, { error: { code: "not_found", message: "Not found", details: null } }, requestId);

    if (found.route.limit) {
      const limited = await runtime.cache.incr(`rl:route:${ip}:${found.route.path}`, 60_000);
      const cap = found.route.limit === 30 ? runtime.config.checkoutPerMinute : found.route.limit;
      if (limited > cap) throw new AppError(429, "rate_limited", "Too many requests.");
    }

    if (pathname === "/health") {
      await runtime.pool.query("select 1");
      await runtime.cache.set("health:ping", "1", 5_000);
      const value = await runtime.cache.get("health:ping");
      return json(200, { ok: value === "1", cache: runtime.config.redisUrl ? "redis" : "memory" }, requestId);
    }

    const actor = await actorFor(runtime.services, request, found.route.auth);
    const result = await found.route.handler({
      actor,
      body: await readBody(request),
      query: Object.fromEntries(url.searchParams),
      params: found.params,
      header: (name) => request.headers.get(name) ?? undefined,
    }, runtime.services);
    return json(request.method === "POST" ? 201 : 200, result ?? { ok: true }, requestId);
  } catch (error) {
    const mapped = mapDbError(error);
    if (mapped instanceof AppError) {
      if (mapped.status >= 500) console.error(JSON.stringify({ msg: mapped.code, requestId, error: mapped.message }));
      return json(mapped.status, { error: { code: mapped.code, message: mapped.message, details: mapped.details ?? null } }, requestId);
    }
    console.error(JSON.stringify({ msg: "request failed", requestId }));
    return json(500, { error: { code: "internal", message: "Internal error", details: null } }, requestId);
  }
}

function normalize(pathname: string) {
  if (pathname === "/api") return "/";
  if (pathname.startsWith("/api/")) return pathname.slice(4);
  return pathname;
}

function match(method: string, pathname: string) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchPath(route.path, pathname);
    if (params) return { route, params };
  }
  return null;
}

function matchPath(pattern: string, pathname: string) {
  const expected = pattern.split("/").filter(Boolean);
  const actual = pathname.split("/").filter(Boolean);
  if (expected.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < expected.length; index += 1) {
    const token = expected[index];
    if (token.startsWith(":")) params[token.slice(1)] = decodeURIComponent(actual[index]);
    else if (token !== actual[index]) return null;
  }
  return params;
}

async function readBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const text = await request.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError(400, "invalid_request", "The request could not be accepted.");
  }
}

async function actorFor(services: Services, request: Request, auth: string) {
  const cartToken = request.headers.get("x-cart-token");
  const authorization = request.headers.get("authorization");
  const path = new URL(request.url).pathname.replace(/\/$/, "");
  if (request.method === "POST" && (path === "/v1/auth/reset" || path === "/api/v1/auth/reset")) {
    return services.auth.guest(cartToken);
  }
  if (authorization?.startsWith("Bearer ")) return services.auth.actorFromToken(authorization.slice(7), cartToken);
  if (auth !== "public") throw new AppError(401, "unauthorized", "Sign in again.");
  return services.auth.guest(cartToken);
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return "local";
}

function json(status: number, body: unknown, requestId: string) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      "x-request-id": requestId,
    },
  });
}
