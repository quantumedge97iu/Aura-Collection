# Database performance

Measured on 7 October 2026 with `node tests/run.mjs` on this Windows machine.

Cluster: PostgreSQL 17.10, embedded, localhost port 54329, `shared_buffers` 128MB, `max_connections` 100. Data directory was deleted when the test stopped. This is not a Supabase project, not a production instance, and not a test of 1,000 or 10,000 concurrent users.

## Volume that was loaded

House catalog from `supabase/seed.sql`: 13 products, 86 variants, 10 categories, 5 collections.

Then `tests/scale.sql` added bench rows. Counts after both:

| Table | Rows |
| --- | --- |
| products | 8,013 |
| variants | 24,086 |
| orders | 4,002 |
| profiles | 2,002 |

Bench load time was 9.0 seconds. Bench orders are read-path fixtures. They are not sales made through `place_order`, and they do not move the bench inventory ledger. Checkout tests used the house SKUs only.

The house catalog alone is too small to expose a bad plan. 8,000 products is large enough to see index choice. It is not 100,000 products and it is not millions of orders.

## Functional results

All of these passed on the run that produced the numbers below.

- 13 products and 86 variants. No password column on `profiles`.
- Duplicate cart line rejected. Quantity 0 rejected.
- `WELCOME10` on the 48,500 PKR ring stored discount 4,850 and total 43,650. The function read `variants.price`.
- Renaming the product and changing the variant price left the order item on "Royal Sparkle Ring" at 48,500.
- Repeating idempotency key `checkout-ayesha-1` returned the same order and left `sold` at 1.
- A second reservation of the last unit raised `insufficient_stock`. Releasing the hold restored `available` to 1.
- Two concurrent `place_order` calls for one unit: one committed, one raised `insufficient_stock`. Final stock was `on_hand` 0, `sold` 1, `available` 0.
- Updating `inventory_transactions` raised `append-only`.
- As `authenticated` for Fatima: Ayesha's orders returned 0 rows, Ayesha's wishlist returned 0 rows, `select cost_price` was permission denied, and `update inventory_levels` was permission denied.

## Plans

`EXPLAIN (ANALYZE, BUFFERS)` after `ANALYZE`. Execution time is the database time. The listing percentiles further down include the client round trip.

| Query | Plan | Execution |
| --- | --- | --- |
| 24 active products by recency | Index scan `products_active_recent` | 0.055 ms |
| Product by slug | Index scan `products_slug_key` | 0.034 ms |
| 24 rings by recency | Index scan `products_active_recent`, then primary key on `product_categories`. 276 products were visited to fill 24 rings. | 1.043 ms |
| Rings in yellow gold | Same category walk, then index-only scan `variants_metal_active` | 1.2 ms |
| Search "diamond", 24 newest | Index scan `products_active_recent` plus a full-text filter. About 2,675 rows match, so the recency index stops early. | 0.067 ms |
| Search token `007777` | Sequential scan of `products`, 8,013 rows removed, 0 hits | 2.682 ms |
| SKU `LJ-RG-048-YG-12` | Index scan `variants_sku_key` | 0.040 ms |
| Available stock by variant id | Index scan `inventory_levels` primary key | 0.040 ms |
| Ayesha's orders | Index scan `orders_customer_recent` | 0.027 ms |
| Open orders (`created`) | Index scan `orders_open` | 0.026 ms |
| Count of rings | Bitmap index scan `product_categories_by_category` | 0.504 ms |
| Cart items for one cart | Sequential scan. The table had 1 row. | 0.035 ms |
| Wishlist for one customer | Sequential scan. The table had 1 row. | 0.035 ms |
| First 24 yellow-gold variants | Sequential scan that stopped after 3 pages. Yellow gold is a third of the bench catalog, and `LIMIT 24` makes the heap cheaper than the index. | 0.042 ms |

`categories` is 10 rows. A sequential scan there is the right plan.

The GIN search index was not chosen for the rare token. The products heap was about 457 pages, and Postgres preferred to read it. 2.7 ms is acceptable at 8,000 products. It will not stay acceptable if a rare query still scans the whole heap at 100,000 products. Re-check that plan after the catalog grows. Do not drop `products_search` because this run seq-scanned a small heap.

`products_name_trgm` and `variants_metal_trgm` were not the winning plan in the queries above. Those queries used full-text or metal equality. The trigram indexes exist because the current storefront search is a substring (`includes`), which full-text will miss for a fragment such as "roy". That path was not timed on its own.

Cart and wishlist sequential scans are expected at one row. `cart_items (cart_id, variant_id)` and the wishlist primary key are the indexes those lookups will use once the tables are larger than a page. An extra cart index would duplicate the unique constraint, so it was not added.

Category page 1 walks recent products until it has 24 matches. At this mix that was 276 index probes and 1.0 ms. Deeper pages, or a rare category sorted by recency, will walk further. If that exceeds the latency budget, the next index is one that orders `(category_id, published_at, product_id)` rather than more single-column indexes.

## Listing latency and concurrency

200 sequential listing queries, after 20 warmup queries, timed from Node on localhost:

| | ms |
| --- | --- |
| average | 0.67 |
| p50 | 0.62 |
| p95 | 1.12 |
| p99 | 1.43 |

The index execution inside Postgres for that statement was 0.055 ms. The rest is round trip and client overhead.

Concurrent listings through a `pg` pool, same statement, 200 queries each:

| Pool size | Rounds | Queries | Wall time | Queries / second |
| --- | --- | --- | --- | --- |
| 20 | 10 | 200 | 504 ms | 396 |
| 50 | 4 | 200 | 1,133 ms | 176 |

At 50 connections this laptop was slower per query, not faster. The pool was competing with itself on one embedded server. Buffer hits were effectively all of the pages these queries touched, because the working set fits in 128MB. That is not a production cache-hit ratio.

Not run: 100, 500, 1,000, 5,000, or 10,000 concurrent users. `tests/k6-catalog.js` targets a future `/shop` URL and was not executed.

## Bottlenecks seen here

- Rare full-text search seq-scans while the product heap is small. Watch this plan as the catalog grows.
- A category page sorted by recency does not start from the category index. It is fine for a first page of a common category and gets more expensive for sparse categories and high offsets. Prefer keyset pagination on `(published_at, id)` over large `OFFSET` values.
- Fifty local connections reduced throughput. The app pool should stay small and let the Supabase pooler multiplex.
- Bench orders are not a proof of checkout throughput. The concurrency proof is two sessions and one unit, which is the correctness case, not a orders-per-second figure.

## When to add the next layer

Redis for catalog reads when listing p95 on the hosted primary is past the page budget, or when CPU stays high on repeated catalog reads. Start with categories, collections, and product pages, keyed with `cache_versions.catalog`. Do not put stock, carts, payments, or open orders in Redis as the authority.

Raise database compute when CPU, memory, or connection waits show up on the hosted project, not because a local embedded server slowed down at 50 connections.

Add a read replica when catalog and account reads, not checkout writes, are the limit. Checkout must keep using the primary so stock locks stay correct.

Add a search service when you need typo tolerance or facets, or when a selective search stops using an index and exceeds the listing budget. Until then, Postgres full-text plus the trigram indexes match the current storefront.

Partition ledger and order-item tables only after they reach the tens of millions and vacuum or index size is the problem. Nothing here is partitioned.

## Commands that produced this file

From `database/`:

```text
npm install
node tests/run.mjs
```

The run applies the three migrations, `supabase/seed.sql`, the assertions, then `tests/scale.sql`, then `EXPLAIN (ANALYZE, BUFFERS)`.

Hosted verification, after the CLI is linked and the project exists:

```text
supabase db reset
supabase db push
```

Do not point `tests/scale.sql` or `tests/run.mjs` at staging or production.
