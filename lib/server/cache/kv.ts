import Redis from "ioredis";

export interface Kv {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  incr(key: string, ttlMs: number): Promise<number>;
  quit(): Promise<void>;
}

export class MemoryKv implements Kv {
  private values = new Map<string, { value: string; exp: number }>();
  private counts = new Map<string, { n: number; exp: number }>();

  async get(key: string) {
    const hit = this.values.get(key);
    if (!hit || hit.exp <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return hit.value;
  }

  async set(key: string, value: string, ttlMs: number) {
    this.values.set(key, { value, exp: Date.now() + ttlMs });
  }

  async incr(key: string, ttlMs: number) {
    const now = Date.now();
    const current = this.counts.get(key);
    if (!current || current.exp <= now) {
      this.counts.set(key, { n: 1, exp: now + ttlMs });
      return 1;
    }
    current.n += 1;
    return current.n;
  }

  async quit() {
    this.values.clear();
    this.counts.clear();
  }
}

export class RedisKv implements Kv {
  constructor(private readonly redis: Redis) {}

  static connect(url: string) {
    return new RedisKv(new Redis(url, { maxRetriesPerRequest: 2, enableReadyCheck: true }));
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlMs: number) {
    await this.redis.set(key, value, "PX", ttlMs);
  }

  async incr(key: string, ttlMs: number) {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.pexpire(key, ttlMs);
    return count;
  }

  async quit() {
    await this.redis.quit();
  }
}
