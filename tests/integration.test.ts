import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { MemoryKv } from "../lib/server/cache/kv.js";
import { createRuntime, dispatch, type Runtime } from "../lib/server/dispatch.js";
import { signTestToken } from "../lib/server/auth/tokens.js";
import { createPool } from "../lib/server/db.js";
import { MemoryBus } from "../lib/server/events/bus.js";
import { createAuthService } from "../lib/server/services/auth.js";
import { runOnce } from "../lib/server/worker/run.js";

const secret = "test-secret-test-secret-test-secret";
const customerId = "11111111-1111-4111-8111-111111111111";
const staffId = "33333333-3333-4333-8333-333333333333";
const adminId = "44444444-4444-4444-8444-444444444444";

test("api against the phase 1 schema", async (t) => {
  const root = join(import.meta.dirname, "..", "database");
  const embedded = new EmbeddedPostgres({ databaseDir: join(import.meta.dirname, "..", "pgdata-api-run"), user: "postgres", password: "postgres", port: 54330, persistent: false });
  await embedded.initialise();
  await embedded.start();
  await embedded.createDatabase("luxe");
  const pool = createPool("postgresql://postgres:postgres@127.0.0.1:54330/luxe");
  const cache = new MemoryKv();
  const runtime = createRuntime({
    port: 0,
    databaseUrl: "",
    redisUrl: null,
    supabaseUrl: null,
    supabaseAnonKey: null,
    supabaseServiceRoleKey: null,
    jwtSecret: secret,
    corsOrigin: "http://localhost:3001",
    logLevel: "silent",
    trustProxy: false,
    rateLimitPerMinute: 500,
    checkoutPerMinute: 50,
  }, pool, cache);
  const app = testClient(runtime);

  t.after(async () => {
    await app.close();
    await pool.end();
    await cache.quit();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await embedded.stop();
        return;
      } catch (error) {
        if (attempt === 4) throw error;
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  });

  const client = await pool.connect();
  try {
    for (const file of ["supabase/migrations/20261007120000_schema.sql", "supabase/migrations/20261007120100_functions.sql", "supabase/migrations/20261007120200_rls.sql", "supabase/migrations/20261007120300_outbox.sql", "supabase/seed.sql"]) {
      await client.query(readFileSync(join(root, file), "utf8"));
    }
    await client.query(
      `insert into profiles (id, full_name, phone, role) values
       ($1, 'Ayesha Khan', '03001234567', 'customer'),
       ($2, 'Staff User', '03001111111', 'staff'),
       ($3, 'Admin User', '03002222222', 'admin')`,
      [customerId, staffId, adminId],
    );
  } finally {
    client.release();
  }

  const customer = await signTestToken(secret, { id: customerId, email: "ayesha@example.com" });
  const staff = await signTestToken(secret, { id: staffId, email: "staff@example.com" });
  const admin = await signTestToken(secret, { id: adminId, email: "admin@example.com" });

  const health = await app.inject({ method: "GET", url: "/health" });
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().cache, "memory");

  const spec = await app.inject({ method: "GET", url: "/v1/openapi.json" });
  assert.equal(spec.statusCode, 200);
  assert.ok(spec.json().paths["/v1/checkout"]);

  const listed = await app.inject({ method: "GET", url: "/v1/products?limit=48" });
  assert.equal(listed.statusCode, 200);
  const products = listed.json().items as Array<{ slug: string; price: number }>;
  assert.ok(products.some((item) => item.slug === "royal-sparkle-ring" && item.price === 48500));
  assert.ok(products.some((item) => item.slug === "heritage-signet-ring"));

  const rings = await app.inject({ method: "GET", url: "/v1/products?category=rings&limit=48" });
  assert.ok((rings.json().items as Array<{ slug: string }>).some((item) => item.slug === "heritage-signet-ring"));

  const found = await app.inject({ method: "GET", url: "/v1/search?q=pearl" });
  assert.ok((found.json().items as Array<{ slug: string }>).some((item) => item.slug === "pearl-drop-earrings"));

  const detail = await app.inject({ method: "GET", url: "/v1/products/royal-sparkle-ring" });
  const variant = (detail.json().variants as Array<{ id: string; sku: string; available: number }>).find((item) => item.sku === "LJ-RG-048-YG-12");
  assert.ok(variant);
  assert.equal(detail.json().cost_price, undefined);
  const before = variant.available;

  const denied = await app.inject({ method: "GET", url: "/v1/admin/orders", headers: { authorization: `Bearer ${customer}` } });
  assert.equal(denied.statusCode, 403);

  const opened = await app.inject({ method: "POST", url: "/v1/carts" });
  assert.equal(opened.statusCode, 201);
  const cartId = opened.json().id as string;
  const cartToken = opened.json().guestToken as string;
  const cartHeaders = { "x-cart-token": cartToken, "content-type": "application/json" };
  const added = await app.inject({ method: "POST", url: `/v1/carts/${cartId}/items`, headers: cartHeaders, payload: { variantId: variant.id, quantity: 1, price: 1 } });
  assert.equal(added.statusCode, 201);

  const quote = await app.inject({ method: "POST", url: "/v1/coupons/quote", headers: cartHeaders, payload: { cartId, code: "welcome10" } });
  assert.equal(quote.statusCode, 201);
  assert.equal(quote.json().discount, 4850);

  const checkout = await app.inject({
    method: "POST",
    url: "/v1/checkout",
    headers: { ...cartHeaders, "idempotency-key": "checkout-guest-1" },
    payload: { cartId, email: "guest@example.com", method: "cod", coupon: "WELCOME10", price: 1, shipping: { name: "Guest Buyer", phone: "03001234567", city: "Karachi", address: "12 Zamzama" } },
  });
  assert.equal(checkout.statusCode, 201, checkout.body);
  assert.equal(checkout.json().total, 43650);
  assert.equal(checkout.json().items[0].unit_price, 48500);

  const replay = await app.inject({
    method: "POST",
    url: "/v1/checkout",
    headers: { ...cartHeaders, "idempotency-key": "checkout-guest-1" },
    payload: { cartId, email: "guest@example.com", method: "cod", shipping: { name: "Guest Buyer", phone: "03001234567", city: "Karachi", address: "12 Zamzama" } },
  });
  assert.equal(replay.json().number, checkout.json().number);
  const stock = await app.inject({ method: "GET", url: `/v1/inventory/${variant.id}` });
  assert.equal(stock.json().available, before - 1);

  const hidden = await app.inject({ method: "GET", url: `/v1/orders/${checkout.json().id}`, headers: { authorization: `Bearer ${customer}` } });
  assert.equal(hidden.statusCode, 404);
  const lookup = await app.inject({ method: "GET", url: `/v1/orders/lookup?number=${checkout.json().number}&email=guest@example.com` });
  assert.equal(lookup.statusCode, 200);
  assert.equal((await app.inject({ method: "GET", url: `/v1/orders/lookup?number=${checkout.json().number}&email=other@example.com` })).statusCode, 404);

  const bar = await app.inject({ method: "GET", url: "/v1/products/aurum-gold-bar" });
  const barVariant = bar.json().variants[0].id as string;
  await pool.query("update inventory_levels set on_hand = 1, reserved = 0, sold = 0 where variant_id = $1", [barVariant]);
  const left = await app.inject({ method: "POST", url: "/v1/carts" });
  const right = await app.inject({ method: "POST", url: "/v1/carts" });
  await app.inject({ method: "POST", url: `/v1/carts/${left.json().id}/items`, headers: { "x-cart-token": left.json().guestToken }, payload: { variantId: barVariant, quantity: 1 } });
  await app.inject({ method: "POST", url: `/v1/carts/${right.json().id}/items`, headers: { "x-cart-token": right.json().guestToken }, payload: { variantId: barVariant, quantity: 1 } });
  const shipping = { name: "Buyer", phone: "03001112222", city: "Lahore", address: "Mall Road" };
  const race = await Promise.all([
    app.inject({ method: "POST", url: "/v1/checkout", headers: { "x-cart-token": left.json().guestToken, "idempotency-key": "race-buyer-a" }, payload: { cartId: left.json().id, email: "a@example.com", method: "card", cardLast4: "4242", shipping } }),
    app.inject({ method: "POST", url: "/v1/checkout", headers: { "x-cart-token": right.json().guestToken, "idempotency-key": "race-buyer-b" }, payload: { cartId: right.json().id, email: "b@example.com", method: "bank", shipping } }),
  ]);
  assert.deepEqual(race.map((item) => item.statusCode).sort(), [201, 409]);
  const barStock = await app.inject({ method: "GET", url: `/v1/inventory/${barVariant}` });
  assert.equal(barStock.json().available, 0);

  const auth = { authorization: `Bearer ${customer}` };
  const mine = await app.inject({ method: "POST", url: "/v1/carts", headers: auth });
  const productId = detail.json().id as string;
  assert.equal((await app.inject({ method: "POST", url: "/v1/wishlist", headers: auth, payload: { productId } })).statusCode, 201);
  assert.equal((await app.inject({ method: "GET", url: "/v1/wishlist", headers: { authorization: `Bearer ${staff}` } })).json().items.length, 0);
  assert.equal((await app.inject({ method: "POST", url: "/v1/products/pearl-drop-earrings/reviews", headers: auth, payload: { rating: 5, title: "Stunning", body: "Even better in person." } })).statusCode, 201);
  const reviewId = (await pool.query("select id from reviews where customer_id = $1", [customerId])).rows[0].id as string;
  assert.equal((await app.inject({ method: "POST", url: `/v1/admin/reviews/${reviewId}`, headers: { authorization: `Bearer ${staff}` }, payload: { status: "published" } })).statusCode, 201);
  assert.equal((await app.inject({ method: "GET", url: "/v1/products/pearl-drop-earrings/reviews" })).json().items.length, 1);

  assert.equal((await app.inject({ method: "PATCH", url: "/v1/me", headers: auth, payload: { fullName: "Ayesha K", phone: "03001234567", role: "admin" } })).json().role, "customer");
  assert.equal((await app.inject({ method: "POST", url: "/v1/me/addresses", headers: auth, payload: { fullName: "Ayesha K", phone: "03001234567", line1: "12 Zamzama", city: "Karachi", isDefaultShipping: true } })).statusCode, 201);

  const ownCart = mine.json().id as string;
  await app.inject({ method: "POST", url: `/v1/carts/${ownCart}/items`, headers: auth, payload: { variantId: variant.id, quantity: 1 } });
  const ownOrder = await app.inject({
    method: "POST",
    url: "/v1/checkout",
    headers: { ...auth, "idempotency-key": "checkout-ayesha-2" },
    payload: { cartId: ownCart, email: "ayesha@example.com", method: "cod", shipping: { name: "Ayesha K", phone: "03001234567", city: "Karachi", address: "12 Zamzama" } },
  });
  assert.equal(ownOrder.statusCode, 201, ownOrder.body);
  const cancelled = await app.inject({ method: "POST", url: `/v1/orders/${ownOrder.json().id}/cancel`, headers: auth, payload: { reason: "changed mind" } });
  assert.equal(cancelled.statusCode, 201, cancelled.body);
  assert.equal(cancelled.json().status, "cancelled");

  assert.equal((await app.inject({ method: "POST", url: "/v1/admin/orders/" + checkout.json().id + "/status", headers: { authorization: `Bearer ${staff}` }, payload: { status: "confirmed", reason: "accepted" } })).statusCode, 201);
  const paymentId = checkout.json().payment.id as string;
  assert.equal((await app.inject({ method: "POST", url: `/v1/admin/payments/${paymentId}`, headers: { authorization: `Bearer ${staff}` }, payload: { status: "paid", providerRef: "bank-1" } })).statusCode, 403);
  assert.equal((await app.inject({ method: "POST", url: `/v1/admin/payments/${paymentId}`, headers: { authorization: `Bearer ${admin}` }, payload: { status: "paid", providerRef: "bank-1" } })).statusCode, 201);

  const created = await app.inject({
    method: "POST",
    url: "/v1/admin/products",
    headers: { authorization: `Bearer ${admin}` },
    payload: { slug: "house-test-ring", name: "House Test Ring", description: "Bench", sku: "LJ-TEST-1", productType: "ring", categorySlug: "rings", variants: [{ sku: "LJ-TEST-1-YG-12", metal: "Yellow Gold", size: "12", price: 10000, stock: 2 }] },
  });
  assert.equal(created.statusCode, 201, created.body);
  const again = await app.inject({ method: "GET", url: "/v1/products/house-test-ring" });
  assert.equal(again.statusCode, 200);
  assert.equal(again.json().variants[0].available, 2);
  await app.inject({ method: "POST", url: "/v1/admin/inventory/adjust", headers: { authorization: `Bearer ${staff}` }, payload: { variantId: again.json().variants[0].id, type: "damage", delta: -1, note: "scratched" } });
  const afterDamage = await app.inject({ method: "GET", url: "/v1/products/house-test-ring" });
  assert.equal(afterDamage.json().variants[0].available, 1);

  const guestEvent = await pool.query("select count(*)::int as n from outbox where dedupe_key = $1", [`order.created.v1:${checkout.json().id}`]);
  assert.equal(guestEvent.rows[0].n, 1);
  const cancelledEvent = await pool.query("select status from outbox where dedupe_key = $1", [`order.cancelled.v1:${ownOrder.json().id}`]);
  assert.equal(cancelledEvent.rows[0].status, "pending");
  assert.equal((await pool.query("select count(*)::int as n from outbox where name = 'payment.updated.v1'")).rows[0].n, 1);

  const accounts = createAuthService(pool, {
    port: 0, databaseUrl: "", redisUrl: null, supabaseUrl: null, supabaseAnonKey: null, supabaseServiceRoleKey: null,
    jwtSecret: secret, corsOrigin: null, logLevel: "silent", trustProxy: false, rateLimitPerMinute: 500, checkoutPerMinute: 50,
  });
  const newbie = "55555555-5555-4555-8555-555555555555";
  await accounts.ensure(newbie, "New Customer");
  await accounts.ensure(newbie, "New Customer");
  assert.equal((await pool.query("select count(*)::int as n from outbox where name = 'user.registered.v1'")).rows[0].n, 1);

  const seen: string[] = [];
  const bus = new MemoryBus();
  const firstPass = await runOnce(pool, { async deliver(event) { seen.push(event.dedupeKey); } }, bus);
  assert.ok(firstPass.delivered >= 5);
  const secondPass = await runOnce(pool, { async deliver(event) { seen.push(event.dedupeKey); } }, bus);
  assert.equal(secondPass.delivered, 0);
  assert.equal(seen.length, firstPass.delivered);

  await pool.query("insert into outbox (name, dedupe_key, payload) values ('notification.test.v1', 'notification.test.v1:1', '{}')");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await runOnce(pool, { async deliver() { throw new Error("smtp down"); } }, new MemoryBus(), { expire: false });
    await pool.query("update outbox set available_at = now() where status = 'pending'");
  }
  const dead = await pool.query("select status, attempts from outbox where dedupe_key = 'notification.test.v1:1'");
  assert.equal(dead.rows[0].status, "dead");
  assert.equal(dead.rows[0].attempts, 5);

  const audit = await app.inject({ method: "GET", url: "/v1/admin/audit?limit=20", headers: { authorization: `Bearer ${admin}` } });
  assert.equal(audit.statusCode, 200);
  assert.ok(audit.json().items.length > 0);
  assert.equal((await app.inject({ method: "GET", url: "/v1/admin/audit", headers: { authorization: `Bearer ${staff}` } })).statusCode, 403);
  assert.equal((await app.inject({ method: "POST", url: `/v1/admin/customers/${customerId}/role`, headers: { authorization: `Bearer ${admin}` }, payload: { role: "staff" } })).statusCode, 201);

  const uncached = await app.inject({ method: "GET", url: "/v1/products?limit=24" });
  assert.equal(uncached.statusCode, 200);
  const samples: number[] = [];
  for (let i = 0; i < 40; i += 1) {
    const started = performance.now();
    const response = await app.inject({ method: "GET", url: "/v1/products?limit=24" });
    assert.equal(response.statusCode, 200);
    samples.push(performance.now() - started);
  }
  samples.sort((a, b) => a - b);
  const p50 = samples[Math.ceil(samples.length * 0.5) - 1];
  const p95 = samples[Math.ceil(samples.length * 0.95) - 1];
  console.log(JSON.stringify({ listingInjectMs: { p50: Number(p50.toFixed(2)), p95: Number(p95.toFixed(2)) } }));
  assert.ok(p95 < 500, `p95 ${p95}`);
});

function testClient(runtime: Runtime) {
  return {
    async close() {},
    async inject(input: { method: string; url: string; headers?: Record<string, string>; payload?: unknown }) {
      const headers = new Headers(input.headers);
      const body = input.payload === undefined ? undefined : JSON.stringify(input.payload);
      if (body && !headers.has("content-type")) headers.set("content-type", "application/json");
      const response = await dispatch(new Request(new URL(input.url, "http://shop.internal"), { method: input.method, headers, body }), runtime);
      const text = await response.text();
      return {
        statusCode: response.status,
        body: text,
        json() {
          return JSON.parse(text) as Record<string, never>;
        },
      };
    },
  };
}
