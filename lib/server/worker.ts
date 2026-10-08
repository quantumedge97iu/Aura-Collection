import { assertRuntime, loadConfig, loadEnvFile } from "./config";
import { createPool } from "./db";
import { MemoryBus, RedisStreamBus } from "./events/bus";
import { LogSink } from "./events/notify";
import { runOnce } from "./worker/run";

loadEnvFile(new URL("../../.env.local", import.meta.url));
loadEnvFile(new URL("../../.env", import.meta.url));

const config = loadConfig();
assertRuntime(config);
if (!config.databaseUrl) throw new Error("DATABASE_URL is required");

const pool = createPool(config.databaseUrl);
const bus = config.redisUrl ? RedisStreamBus.connect(config.redisUrl) : new MemoryBus();
if (!config.redisUrl) {
  console.warn(JSON.stringify({ msg: "REDIS_URL is unset. Events stay in Postgres until a Redis consumer is configured." }));
}

const sink = new LogSink();
let stopped = false;
let lastExpire = 0;
const stop = () => {
  stopped = true;
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.log(JSON.stringify({ msg: "worker started" }));
while (!stopped) {
  const expire = Date.now() - lastExpire >= 30_000;
  try {
    const result = await runOnce(pool, sink, bus, { expire });
    if (expire) lastExpire = Date.now();
    if (result.delivered > 0 || result.failed > 0 || result.released > 0) {
      console.log(JSON.stringify({ msg: "worker tick", ...result }));
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "tick failed";
    console.error(JSON.stringify({ msg: "worker tick failed", error: reason }));
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

await bus.quit();
await pool.end();
