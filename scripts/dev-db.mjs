import { readFileSync } from "node:fs";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const embedded = new EmbeddedPostgres({
  databaseDir: join(import.meta.dirname, "..", "pgdata-dev"),
  user: "postgres",
  password: "postgres",
  port: 54332,
  persistent: true,
});

await embedded.initialise();
await embedded.start();
try {
  await embedded.createDatabase("luxe");
} catch {
  /* already created */
}

const client = new pg.Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54332/luxe" });
await client.connect();
const exists = await client.query("select to_regclass('public.products') as name");
if (!exists.rows[0].name) {
  const root = join(import.meta.dirname, "..", "database");
  for (const file of [
    "supabase/migrations/20261007120000_schema.sql",
    "supabase/migrations/20261007120100_functions.sql",
    "supabase/migrations/20261007120200_rls.sql",
    "supabase/migrations/20261007120300_outbox.sql",
    "supabase/seed.sql",
  ]) {
    await client.query(readFileSync(join(root, file), "utf8"));
  }
}
const count = await client.query("select count(*)::int as n from products");
console.log(`products ${count.rows[0].n}`);
await client.end();
await new Promise(() => {});
