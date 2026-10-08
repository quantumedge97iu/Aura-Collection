import { readFileSync } from "node:fs";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { createRuntime, dispatch } from "../lib/server/dispatch.js";
import { MemoryKv } from "../lib/server/cache/kv.js";
import { createPool } from "../lib/server/db.js";

const embedded = new EmbeddedPostgres({ databaseDir: join(import.meta.dirname, "..", "pgdata-perf"), user: "postgres", password: "postgres", port: 54331, persistent: false });
await embedded.initialise();
await embedded.start();
await embedded.createDatabase("luxe");
const pool = createPool("postgresql://postgres:postgres@127.0.0.1:54331/luxe");
const root = join(import.meta.dirname, "..", "database");
const client = await pool.connect();
for (const file of ["supabase/migrations/20261007120000_schema.sql", "supabase/migrations/20261007120100_functions.sql", "supabase/migrations/20261007120200_rls.sql", "supabase/migrations/20261007120300_outbox.sql", "supabase/seed.sql"]) {
  await client.query(readFileSync(join(root, file), "utf8"));
}
client.release();
const runtime = createRuntime({
  port: 0, databaseUrl: "", redisUrl: null, supabaseUrl: null, supabaseAnonKey: null, supabaseServiceRoleKey: null,
  jwtSecret: "test-secret-test-secret-test-secret", corsOrigin: null, logLevel: "silent", trustProxy: false,
  rateLimitPerMinute: 5000, checkoutPerMinute: 500,
}, pool, new MemoryKv());

async function inject(url: string) {
  const response = await dispatch(new Request(new URL(url, "http://shop.internal")), runtime);
  if (!response.ok) throw new Error(await response.text());
}

await inject("/v1/products?limit=24");
const samples: number[] = [];
for (let i = 0; i < 100; i += 1) {
  const started = performance.now();
  await inject("/v1/products?limit=24");
  samples.push(performance.now() - started);
}
samples.sort((a, b) => a - b);
const pick = (p: number) => samples[Math.min(samples.length - 1, Math.ceil(samples.length * p) - 1)];
console.log(JSON.stringify({ samples: samples.length, p50: Number(pick(0.5).toFixed(2)), p95: Number(pick(0.95).toFixed(2)), p99: Number(pick(0.99).toFixed(2)) }));
await pool.end();
await embedded.stop();
