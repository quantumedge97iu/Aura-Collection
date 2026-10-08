import assert from "node:assert/strict";
import test from "node:test";
import { MemoryKv } from "../lib/server/cache/kv.js";
import { assertRuntime, loadConfig } from "../lib/server/config.js";
import { canReadOrder, canUseCart, catalogCacheKey, discountFor } from "../lib/server/domain.js";
import { mapDbError, AppError } from "../lib/server/http/errors.js";
import { openApiDocument } from "../lib/server/openapi.js";
import { paymentProvider } from "../lib/server/payments/providers.js";

test("coupon math matches the database integer formula", () => {
  assert.equal(discountFor(48500, { discountType: "percent", amount: 10, minSubtotal: 20000, maxDiscount: 8000 }), 4850);
  assert.equal(discountFor(200000, { discountType: "percent", amount: 10, minSubtotal: 0, maxDiscount: 8000 }), 8000);
  assert.equal(discountFor(1000, { discountType: "fixed", amount: 5000, minSubtotal: 0, maxDiscount: null }), 1000);
  assert.throws(() => discountFor(1000, { discountType: "percent", amount: 10, minSubtotal: 20000, maxDiscount: null }));
});

test("cart and order access follow the owner", () => {
  const guest = { id: null, role: "guest" as const, jwtRole: "anon" as const, cartToken: "token", email: null };
  assert.equal(canUseCart({ customerId: null, guestToken: "token" }, guest), true);
  assert.equal(canUseCart({ customerId: null, guestToken: "other" }, guest), false);
  assert.equal(canReadOrder({ customerId: "a" }, { ...guest, id: "b", role: "customer" }), false);
  assert.equal(canReadOrder({ customerId: "a" }, { ...guest, id: "a", role: "customer" }), true);
  assert.equal(canReadOrder({ customerId: "a" }, { ...guest, role: "staff" }), true);
});

test("catalog cache keys include the database version", () => {
  assert.equal(catalogCacheKey(3, "product", { slug: "ring" }), catalogCacheKey(3, "product", { slug: "ring" }));
  assert.notEqual(catalogCacheKey(3, "product", { slug: "ring" }), catalogCacheKey(4, "product", { slug: "ring" }));
});

test("card payment keeps only the last four digits", () => {
  assert.equal(paymentProvider("card").prepare({ cardLast4: "4242" }).provider, "card");
  assert.equal(paymentProvider("cod").prepare({}).cardLast4, null);
  assert.throws(() => paymentProvider("card").prepare({}), AppError);
});

test("production boot requires Redis", () => {
  const config = loadConfig({ JWT_SECRET: "test-secret-test-secret-test-secret" });
  assert.throws(() => assertRuntime(config, { NODE_ENV: "production" }), /REDIS_URL/);
  assert.doesNotThrow(() => assertRuntime(config, { NODE_ENV: "development" }));
});

test("database errors become API errors", () => {
  const error = mapDbError(Object.assign(new Error("insufficient_stock"), { code: "P0001" }));
  assert.ok(error instanceof AppError);
  assert.equal(error.status, 409);
});

test("memory rate limit expires a window", async () => {
  const kv = new MemoryKv();
  assert.equal(await kv.incr("ip", 1_000), 1);
  assert.equal(await kv.incr("ip", 1_000), 2);
  await kv.set("catalog:1:list:{}", "{\"ok\":true}", 1_000);
  assert.equal(await kv.get("catalog:1:list:{}"), "{\"ok\":true}");
});

test("openapi lists checkout", () => {
  const doc = openApiDocument([{ method: "POST", path: "/v1/checkout", summary: "Place an order", auth: "public" }]);
  assert.ok(doc.paths["/v1/checkout"]);
});
