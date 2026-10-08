import Redis from "ioredis";
import type { OutboxMessage } from "./outbox";

export interface EventBus {
  publish(event: OutboxMessage): Promise<void>;
  quit(): Promise<void>;
}

export class MemoryBus implements EventBus {
  readonly published: OutboxMessage[] = [];

  async publish(event: OutboxMessage) {
    this.published.push(event);
  }

  async quit() {}
}

export class RedisStreamBus implements EventBus {
  constructor(private readonly redis: Redis) {}

  static connect(url: string) {
    return new RedisStreamBus(new Redis(url, { maxRetriesPerRequest: 2, enableReadyCheck: true }));
  }

  async publish(event: OutboxMessage) {
    await this.redis.xadd(
      "events",
      "MAXLEN",
      "~",
      "10000",
      "*",
      "id",
      event.id,
      "name",
      event.name,
      "dedupe",
      event.dedupeKey,
      "payload",
      JSON.stringify(event.payload),
    );
  }

  async quit() {
    await this.redis.quit();
  }
}
