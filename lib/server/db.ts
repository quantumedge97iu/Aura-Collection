import pg from "pg";
import type { Actor } from "./domain";
import { mapDbError } from "./http/errors";

const { Pool } = pg;
export type Db = pg.PoolClient;

export function createPool(databaseUrl: string) {
  const hosted = databaseUrl.includes("supabase.co") || databaseUrl.includes("supabase.com");
  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    ssl: hosted ? { rejectUnauthorized: false } : undefined,
  });
}

export async function withActor<T>(pool: pg.Pool, actor: Actor, run: (db: Db) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claim.role', $1, true)", [actor.jwtRole]);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [actor.id ?? ""]);
    const headers = JSON.stringify(actor.cartToken ? { "x-cart-token": actor.cartToken } : {});
    await client.query("select set_config('request.headers', $1, true)", [headers]);
    const value = await run(client);
    await client.query("commit");
    return value;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      /* the connection is already closing */
    }
    throw mapDbError(error);
  } finally {
    client.release();
  }
}

export async function rows<T extends pg.QueryResultRow>(db: Db, text: string, values: unknown[] = []) {
  const started = performance.now();
  const result = await db.query<T>(text, values);
  const ms = performance.now() - started;
  if (ms > 200) console.warn(JSON.stringify({ msg: "slow query", ms: Math.round(ms), text: text.slice(0, 180) }));
  return result.rows;
}
