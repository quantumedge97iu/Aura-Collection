import { readFileSync } from "node:fs";

export type Config = {
  port: number;
  databaseUrl: string;
  redisUrl: string | null;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  supabaseServiceRoleKey: string | null;
  jwtSecret: string;
  corsOrigin: string | null;
  logLevel: string;
  trustProxy: boolean;
  rateLimitPerMinute: number;
  checkoutPerMinute: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const jwtSecret = env.JWT_SECRET ?? "";
  return {
    port: Number(env.PORT ?? 4000),
    databaseUrl: env.DATABASE_URL ?? "",
    redisUrl: env.REDIS_URL || null,
    supabaseUrl: env.SUPABASE_URL || null,
    supabaseAnonKey: env.SUPABASE_ANON_KEY || null,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || null,
    jwtSecret,
    corsOrigin: env.CORS_ORIGIN || null,
    logLevel: env.LOG_LEVEL ?? "info",
    trustProxy: env.TRUST_PROXY === "true",
    rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE ?? 300),
    checkoutPerMinute: Number(env.CHECKOUT_PER_MINUTE ?? 30),
  };
}

export function assertRuntime(config: Config, env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV === "production" && !config.redisUrl) {
    throw new Error("REDIS_URL is required when NODE_ENV is production");
  }
}

export function loadEnvFile(url: URL) {
  try {
    for (const line of readFileSync(url, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const eq = trimmed.indexOf("=");
      const key = trimmed.slice(0, eq);
      if (process.env[key] == null) process.env[key] = trimmed.slice(eq + 1);
    }
  } catch {
    /* env can come from the shell */
  }
}
