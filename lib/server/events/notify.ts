import type { OutboxMessage } from "./outbox";

export interface NotificationSink {
  deliver(event: OutboxMessage): Promise<void>;
}

/** Records the event. A real email or SMS provider replaces this without touching checkout. */
export class LogSink implements NotificationSink {
  async deliver(event: OutboxMessage) {
    console.log(JSON.stringify({ msg: "notification", id: event.id, name: event.name, attempt: event.attempts }));
  }
}
