# Microservices architecture plan

This is an audit and a migration plan. No service was extracted while writing it.

The platform can be shaped for a million users. It should not be split into seventeen network services to get there. The checkout path is one database transaction on purpose. Breaking that apart before an outbox and idempotent consumers exist would create overselling and duplicate orders.

## What exists today

The shop and the API are one Next.js app. Fastify is not part of this project, and there is no `backend/` folder.

```text
Browser
  → Next.js (port 3001)
       → pages, and /api/v1/* in the same app
            → one Postgres database
            → Redis, only if REDIS_URL is set
       → Sanity Content Lake CDN, only if SANITY_PROJECT_ID is set
```

| Layer | Where | What it actually does |
| --- | --- | --- |
| Storefront | `app/`, `components/`, `lib/` | Next.js 16 App Router. Shop, product, search, cart, wishlist, checkout, orders, account, journal, policies. |
| API | `app/api`, `lib/server/` | Next.js route handlers. Route → controller → service → repository → SQL. About 50 routes under `/api/v1`. |
| Database | `database/supabase/migrations/` | One Postgres schema. 13 products and 86 variants in the seed. Scale script (local only) loaded about 8,000 products. |
| Editorial | `../sanity` | Studio and schemas for homepage, hero, banners, campaigns, landing pages, journal, FAQ, policies, navigation, footer, SEO, product stories. Not connected until a project id is set. |
| AI | `components/aura.tsx`, `lib/assist.ts` | Aura loads up to 48 products from the catalog API and filters them in the browser. No model, no agent service, no vector index. |
| Payments | `lib/server/payments/providers.ts` | Cash, bank transfer, or last four card digits. No card network, no webhooks, no refunds API. Payment stays pending until a manager records it. |

There is no message broker, no worker process, no cron, no notification sender, no OpenTelemetry, and no Docker Compose for the full stack.

## API surface

Public and customer routes already live on one process:

- Catalog: products, search, categories, brands, collections, reviews
- Inventory: live availability, reserve, release, staff adjust, expire holds
- Cart and wishlist, including guest carts via `X-Cart-Token`
- Checkout, coupon quote, orders, guest lookup, cancellation
- Profile and addresses
- Auth: `POST /v1/auth/login` and `/v1/auth/register`, proxied to Supabase Auth when configured
- Admin: order queue, status, payments, coupons, review moderation, customers, roles, product create/update, cost price, audit log

OpenAPI is `GET /v1/openapi.json`. Zod validates bodies. Errors are `{ error: { code, message, details } }`. Checkout requires an `Idempotency-Key` of at least 8 characters.

## Database ownership today

Everything is in `public` and is reached by one pool.

| Tables | Business area |
| --- | --- |
| `profiles`, `addresses` | Customer |
| `brands`, `categories`, `collections`, `products`, `product_*`, `variants` | Catalog |
| `inventory_levels`, `inventory_reservations`, `inventory_transactions` | Stock ledger |
| `carts`, `cart_items`, `wishlists`, `wishlist_items` | Shopping |
| `coupons`, `coupon_*` | Promotions |
| `orders`, `order_items`, `order_status_history`, `payments` | Orders and payments |
| `shipping_zones`, `shipping_rates`, `shipments` | Delivery |
| `reviews` | Reviews |
| `audit_log`, `cache_versions` | Audit and catalog cache version |

Atomic work is already in SQL, not in application loops:

- `place_order` prices the cart from the database, applies the coupon, quotes shipping, reserves stock with row locks, writes the order snapshot, and inserts a pending payment
- `reserve_inventory`, `release_reservation`, `expire_reservations`, `adjust_inventory`
- `cancel_order`, `set_order_status`, `claim_guest_cart`

`place_order` is the reason Order, Inventory, Pricing, and Shipping cannot be separate databases yet. One transaction is what stops two buyers from taking the last unit.

## What is coupled, duplicated, or missing

**Must stay in one transaction for now**

Checkout reads price, stock, coupon, and shipping fee inside `place_order`. The Node coupon helper `discountFor` in `lib/server/domain.ts` is a second copy of discount math used by the quote endpoint. The order total is the SQL result, which is correct, but the two formulas can drift.

**Shared mutable state that blocks horizontal scale**

If `REDIS_URL` is unset, rate limits, catalog cache, and checkout idempotency keys live in process memory (`MemoryKv`). A second API instance would not see them. That is the first production defect, not a missing microservice.

**Search**

`searchProducts` is `ILIKE` across name, SKU, metal, tag, and category. It is cached with the catalog. It is not a search engine, and it does not need one at the current catalog size.

**Not built**

- Password reset, email verification, OAuth
- Notifications (email, SMS, push, WhatsApp)
- Background jobs and scheduled expiry of reservations (only an admin HTTP call exists)
- Payment provider webhooks and refunds
- Analytics pipeline
- Distributed tracing
- Seller or marketplace accounts

**Security notes from the current code**

- Passwords stay in Supabase Auth. The shop stores no password column.
- Card data is last four digits only. There is no PCI vault, and none should be added.
- Guest order lookup needs order number and email. Cancellation requires a signed-in owner and an unpaid, early status.
- Authorization is the API plus database role checks. The frontend is not trusted for price, stock, role, or totals.
- CORS is a single configured origin. Security headers are limited to `nosniff`.
- Logs redact `Authorization`.
- Production must not use a superuser pool. Tests do, because the harness applies migrations as a superuser.
- Webhook signature verification does not exist because no payment provider calls in.
- Service-to-service auth does not exist because there is one service.

**AI**

Aura cannot place an order. If it fails, browsing and checkout still work. That property has to be kept.

**CMS**

Sanity owns marketing pages, navigation labels, footer, SEO, and product stories. The API owns transactions. The storefront reads Sanity from the CDN when configured, and falls back to built-in copy when it is not. A Content Service would only proxy Sanity. Do not build one.

## Target shape

Do not deploy this picture on day one. It is the end state after the migration below.

```text
                         Load balancer
                              │
                     Next.js /api/v1
                     public /v1 only
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
   Commerce process      Worker process         AI process
   catalog, cart,        outbox consumer        recommendations
   checkout, orders      notifications          and agents
        │                expire holds                │
        │                     │                      │
        └──────────┬──────────┴──────────────────────┘
                   │
              Postgres (source of truth)
              Redis (cache, locks, streams)
```

Frontend traffic for orders, cart, and catalog keeps using the API. Editorial pages keep using the Sanity CDN. AI calls the same public catalog and cart APIs a browser would. It never writes inventory or payments.

### Why each candidate service is accepted or deferred

| Candidate | Decision | Why |
| --- | --- | --- |
| API Gateway | Keep the Next.js `/api` routes as the only public API | A second gateway in front of one app adds a hop and no isolation. Split it only when a second deployable exists. |
| Auth Service | Do not build one | Supabase Auth already issues the identity. The API verifies the JWT and loads the role from `profiles`. |
| User Service | Module now, schema later | Profile and addresses are small and already behind `/v1/me`. |
| Product Service | Module inside Commerce | Catalog writes are admin routes. Other code already goes through repositories. |
| Search Service | Interface now, engine later | `ILIKE` is fine for thousands of SKUs. Hide it behind the catalog service so OpenSearch can replace the query without a new public API. |
| Inventory Service | Stay inside `place_order` | Stock locks are the checkout transaction. Extract only after an outbox can publish `InventoryReserved` from that same transaction. |
| Cart Service | Stay in Commerce. Redis may cache the read model later | The cart row in Postgres is the source of truth. Redis-only carts lose guest carts on failover. |
| Order Service | Stay in Commerce | Order creation is `place_order`. |
| Payment Service | Module, then a worker for webhooks | Providers are a strategy object. When a real provider arrives, its webhooks belong in a worker with signature checks, still writing through one payment repository. |
| Pricing Service | Module. One formula | Delete the drift between `discountFor` and SQL by making SQL the only calculator. The quote endpoint should call that. |
| Shipping Service | Module | Cities and fees are tables. No courier API exists. |
| Notification Service | First worker | Nothing sends mail today. A failed send must not roll back an order. |
| Wishlist Service | Stay in Commerce | Two tables, three routes. |
| Review Service | Stay in Commerce | Moderation is an admin route. |
| AI Service | Separate process, later | Must scale on its own and must not sit on the checkout path. |
| Analytics Service | Events into the worker | Do not add a request on the shopping path. |
| Content Service | Do not create | Sanity is the CMS. |

## Database plan

Keep one Postgres cluster. Do not open twelve databases.

Stage 1, now: one schema, repositories are the only SQL. No new query from a controller or from the Next.js server.

Stage 2: schemas as ownership fences, still one cluster, still one checkout transaction.

- `identity`: `profiles`, `addresses`
- `catalog`: products, variants, categories, brands, collections, reviews
- `commerce`: carts, wishlists, coupons, orders, payments, shipping, inventory
- `platform`: `audit_log`, `cache_versions`, `outbox`

Cross-schema foreign keys may remain while checkout is one transaction. Direct table writes from another module may not. When inventory is actually extracted, the foreign key from `order_items` to `variants` becomes a stored snapshot, which `place_order` already writes.

## Communication

**Synchronous, through `/v1`**

Anything the screen waits on: catalog, search, cart, quote, checkout, order read, profile.

**Asynchronous, after the transaction commits**

Add an `outbox` table written in the same transaction as the business change. A worker publishes and marks the row sent. Consumers are idempotent.

| Event | Published when | Consumers |
| --- | --- | --- |
| `order.created.v1` | `place_order` commits | notification, analytics |
| `order.cancelled.v1` | `cancel_order` commits | notification, analytics |
| `payment.updated.v1` | admin payment status | notification, analytics |
| `inventory.hold_expired.v1` | `expire_reservations` | analytics |
| `user.registered.v1` | profile insert | notification |
| `shipment.updated.v1` | shipment status change | notification |

Do not emit `InventoryReserved` to a second service during checkout. The reservation already happened inside the order transaction. An event is a fact for other consumers, not a request to reserve stock again.

## Redis

Redis is required for any deployment with more than one API process.

| Use | Key | Source of truth |
| --- | --- | --- |
| Catalog cache | `catalog:{version}:…` | Postgres. Stock reads bypass the cached payload. |
| Rate limit | `rl:{ip}:{method}:{path}` | Redis counter, 60 second window |
| Checkout idempotency | `idem:checkout:{actor}:{key}` | Postgres order plus this key. 24 hours. |
| Reservation expiry lock | short lock around `expire_reservations` | Postgres ledger |

Do not put carts, orders, payments, or stock balances in Redis as the only copy.

## Queue

Use Redis Streams, not Kafka.

Redis is already the cache. Streams give consumer groups, pending entries, retries, and a dead-letter stream. The expected volume is order events, not a clickstream of millions of messages per minute. Kafka pays for itself at that larger stream. RabbitMQ is the alternative if the team wants its management UI more than one fewer system.

The worker must:

- retry with backoff
- park poison messages on `events.dlq`
- ignore a second delivery of the same event id
- log the event name and version

## API rules that already hold, and the gaps

Already true: `/v1`, Zod, a single error shape, bearer auth, role checks, pagination cursors on the catalog, idempotency on checkout, request ids.

Still to add before more than one public client exists:

- the same error shape on the worker
- pagination on admin lists that can grow
- webhook signatures on the future payment callback
- no new public port for the worker or the AI process

## Security bar for the next step

- `JWT_SECRET`, `DATABASE_URL`, `SUPABASE_ANON_KEY`, and Sanity tokens stay in the environment
- production database role cannot bypass row security the way the test superuser can
- rate limits only count if Redis is up; otherwise the process should refuse to boot in production
- payment webhooks, when added, verify a signature before any status change
- AI credentials, when added, are only on the AI process

## Observability

The API returns `x-request-id` on each response.

Next, every log line and every outbox event carries that id. Metrics worth adding on the one process before any split:

- request count, 5xx count, latency
- checkout success and `insufficient_stock`
- cache hits
- outbox lag
- Redis and pool errors

OpenTelemetry comes when a second process exists. Until then a correlation id across the HTTP log and the worker log is enough to trace checkout → notification.

## Scale and failure

Stateless API processes behind a load balancer, one Postgres primary, Redis, and a worker pool.

| Failure | Required behavior |
| --- | --- |
| AI process down | Shop, cart, and checkout keep working. Aura shows the existing empty-catalog line. |
| Worker or Redis Streams down | Orders still commit. Notifications wait in the outbox and send later. |
| Sanity down | Shop uses built-in editorial copy. Catalog and checkout do not call Sanity. |
| Search query slow | Catalog list by category still works. Search can time out on its own. |
| Postgres down | The API returns 500. That is an honest full outage. No cache may answer stock or checkout. |

`expire_reservations` moves from a manual admin call to a worker tick so holds cannot pin stock forever if nobody presses the button.

## Local runtime

Docker Compose is a later step, after the worker exists. The local topology to aim at:

- `postgres`
- `redis`
- `web` (this Next.js app, including `/api`)
- `worker` (new process, same repo)
- `web` (current Next.js app)
- Sanity studio stays a separate `npm run dev`, not a compose dependency of checkout

## Migration

Strangler order. Each step leaves the current shop working.

1. **Production boot guard.** Refuse to start the API in production when `REDIS_URL` is missing. Keep `MemoryKv` for tests.
2. **One discount function.** Quote and `place_order` use the same SQL calculation.
3. **Outbox plus worker** in this app. First jobs: expire reservations, send nothing until a provider exists, record the event. Checkout does not wait for the worker.
4. **Notification provider** behind the worker. A failed send retries. It does not change the order.
5. **Search port** inside the catalog service. Implementation stays SQL.
6. **AI process** that calls `/v1/products` and `/v1/search`. Aura stops being the only concierge. Checkout does not call it.
7. **Schemas** in Postgres once the worker is stable. Still one checkout transaction.
8. **Extract inventory** only if lock contention on `place_order` shows up in metrics. The SQL functions become the inventory API. The order transaction calls them through a local module until that day.

Do not extract Auth, User, Wishlist, Reviews, Shipping, or a CMS service in this sequence.

## Tests that must exist before a split

The backend already has unit, integration, and a small in-process perf script. Keep those green.

Before the worker ships, add tests for:

- checkout replay with the same idempotency key returns the same order
- two concurrent checkouts of the last unit: one wins, one gets `insufficient_stock`
- worker down: the order still exists and the outbox row remains unsent
- worker retry does not send two notifications for one event
- expired hold returns stock
- catalog response with Redis flushed still matches Postgres
- Aura or the AI client timing out does not fail `POST /v1/checkout`

## What this plan refuses

- A big-bang rewrite
- Kafka as the first broker
- Redis as the order or stock database
- A second CMS
- Services that write each other's tables
- AI on the checkout critical path
- Seventeen deployables for a catalog of one house and one checkout transaction

## First implementation step

Done in the existing API, without a second public service and without a storefront change.

- `database/supabase/migrations/20261007120300_outbox.sql` adds the outbox. Checkout, cancel, payment status, and a new profile write an event in the same database transaction.
- `npm run worker` claims those rows, expires stock holds, and records a notification. A failed notification retries, then lands on `dead`. The order is already committed.
- Production boot (`NODE_ENV=production`) refuses to start without `REDIS_URL`. Local development still runs with in-process cache.
- When `REDIS_URL` is set, the worker also appends the event to the Redis stream `events`. Postgres stays the source of truth.
