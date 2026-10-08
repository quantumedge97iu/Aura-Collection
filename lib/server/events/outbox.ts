import { rows, type Db } from "../db";

export type OutboxMessage = {
  id: string;
  name: string;
  aggregateId: string | null;
  dedupeKey: string;
  payload: Record<string, unknown>;
  attempts: number;
};

export async function enqueue(
  db: Db,
  event: { name: string; aggregateId?: string | null; dedupeKey: string; payload: Record<string, unknown> },
) {
  await rows(db, `
    insert into outbox (name, aggregate_id, dedupe_key, payload)
    values ($1, $2, $3, $4::jsonb)
    on conflict (dedupe_key) do nothing
  `, [event.name, event.aggregateId ?? null, event.dedupeKey, JSON.stringify(event.payload)]);
}

export async function claim(db: Db, workerId: string, limit: number) {
  const claimed = await rows<{
    id: string;
    name: string;
    aggregate_id: string | null;
    dedupe_key: string;
    payload: Record<string, unknown>;
    attempts: number;
  }>(db, `
    with picked as (
      select id from outbox
      where (status = 'pending' and available_at <= now())
         or (status = 'processing' and locked_at < now() - interval '60 seconds')
      order by created_at
      for update skip locked
      limit $2
    )
    update outbox as message
    set status = 'processing', attempts = message.attempts + 1, locked_by = $1, locked_at = now(), last_error = null
    from picked
    where message.id = picked.id
    returning message.id, message.name, message.aggregate_id, message.dedupe_key, message.payload, message.attempts
  `, [workerId, limit]);
  return claimed.map((row) => ({
    id: row.id,
    name: row.name,
    aggregateId: row.aggregate_id,
    dedupeKey: row.dedupe_key,
    payload: row.payload,
    attempts: row.attempts,
  }));
}

export async function markSent(db: Db, id: string) {
  await rows(db, `
    update outbox set status = 'sent', sent_at = now(), locked_by = null where id = $1 and status = 'processing'
  `, [id]);
}

export async function markFailed(db: Db, id: string, error: string) {
  await rows(db, `
    update outbox
    set status = case when attempts >= 5 then 'dead' else 'pending' end,
        available_at = case
          when attempts >= 5 then available_at
          else now() + make_interval(secs => least((2 ^ attempts)::int, 300))
        end,
        last_error = left($2, 500),
        locked_by = null
    where id = $1 and status = 'processing'
  `, [id, error]);
}
