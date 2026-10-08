import type pg from "pg";
import { systemActor } from "../domain";
import { withActor } from "../db";
import type { EventBus } from "../events/bus";
import type { NotificationSink } from "../events/notify";
import { claim, enqueue, markFailed, markSent } from "../events/outbox";
import { expireReservations } from "../repositories/admin";

export async function runOnce(
  pool: pg.Pool,
  sink: NotificationSink,
  bus: EventBus,
  options: { workerId?: string; limit?: number; expire?: boolean } = {},
) {
  const workerId = options.workerId ?? "worker";
  const limit = options.limit ?? 20;
  let released = 0;
  if (options.expire !== false) {
    released = await withActor(pool, systemActor, async (db) => {
      const count = await expireReservations(db);
      if (count > 0) {
        await enqueue(db, {
          name: "inventory.hold_expired.v1",
          dedupeKey: `inventory.hold_expired.v1:${crypto.randomUUID()}`,
          payload: { released: count },
        });
      }
      return count;
    });
  }

  const messages = await withActor(pool, systemActor, (db) => claim(db, workerId, limit));
  let delivered = 0;
  let failed = 0;
  for (const message of messages) {
    try {
      await sink.deliver(message);
      await bus.publish(message);
      await withActor(pool, systemActor, (db) => markSent(db, message.id));
      delivered += 1;
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : "delivery failed";
      await withActor(pool, systemActor, (db) => markFailed(db, message.id, reason));
      console.error(JSON.stringify({ msg: "notification failed", id: message.id, name: message.name, error: reason }));
    }
  }
  return { released, delivered, failed };
}
