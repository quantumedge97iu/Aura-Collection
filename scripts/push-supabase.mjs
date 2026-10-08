import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  const eq = trimmed.indexOf("=");
  env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

const databaseUrl = env.SUPABASE_DB_URL || "";
if (!databaseUrl.includes("supabase.co") && !databaseUrl.includes("supabase.com")) {
  console.error("Set SUPABASE_DB_URL in .env.local to the Postgres connection string from Supabase → Project Settings → Database.");
  process.exit(1);
}

const root = join(import.meta.dirname, "..", "database", "supabase");
const files = [
  "migrations/20261007120000_schema.sql",
  "migrations/20261007120100_functions.sql",
  "migrations/20261007120200_rls.sql",
  "migrations/20261007120300_outbox.sql",
  "seed.sql",
];

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const file of files) {
    await client.query(readFileSync(join(root, file), "utf8"));
    console.log(`applied ${file}`);
  }
  const products = await client.query("select count(*)::int as n from products");
  const profiles = await client.query("select count(*)::int as n from profiles");
  console.log(JSON.stringify({ products: products.rows[0].n, profiles: profiles.rows[0].n }));
} finally {
  await client.end();
}
