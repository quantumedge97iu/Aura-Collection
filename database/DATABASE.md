# Luxe Jewels database

Phase 1 is the PostgreSQL schema only. The Next.js storefront is unchanged and still reads its local catalog. There is no backend folder and no API in this phase.

Money is whole PKR, matching the prices in `lib/catalog.ts`. Passwords are not stored here. Supabase Auth owns them. `profiles.id` is the auth user id, and a foreign key to `auth.users` is added when that table exists.

## What is implemented, tested, and still future

Implemented in `supabase/migrations` and `supabase/seed.sql`:

- Catalog, variants, inventory ledger, carts, wishlists, addresses, orders, payments, shipping, coupons, reviews, audit, and row level security.
- Checkout and stock changes go through SQL functions. The browser cannot set price, discount, or stock.

Tested locally on disposable Postgres 17.10 (Windows, embedded, `shared_buffers` 128MB, `max_connections` 100):

- Seed matches the 13 storefront products and 86 metal/size SKUs.
- Coupon math, order snapshots, idempotent replay, reservation, and two concurrent checkouts of the last unit.
- A customer session cannot read another customer's orders or wishlist, cannot read `cost_price`, and cannot update stock.
- The inventory ledger rejects updates.

Benchmarked on that same local cluster after loading 8,000 extra products. Numbers are in `DATABASE-PERFORMANCE.md`. They are not production capacity.

Not done, and not claimed:

- Hosted Supabase, PITR, backups, read replicas, Redis, k6 against an API, or a million concurrent users.
- The k6 file in `tests/k6-catalog.js` is a Phase 2 script. It was not run. Phase 1 has no HTTP API.

## Frontend contract

| Storefront | Database |
| --- | --- |
| `Product.slug`, `name`, `description`, `sku`, `image` | `products` |
| `price` (whole PKR) | `variants.price`. Every variant of a seeded piece uses the product price. Checkout reads this column, never a client price. |
| `category` | primary row in `product_categories` |
| `appearsIn` | extra rows in `product_categories` |
| `tags` `new`, `bestseller`, `gift` | `product_tags`. Gifts, new arrivals, and bestsellers stay tags. The Gifts category row is only the nav image. |
| `metals`, `sizes` | one `variants` row per pair. Cart identity is that row, not the product. |
| `details[]` | `product_details` |
| `collections` | `collections` and `collection_products` |
| `CartLine` qty 1–8 | `cart_items.quantity` |
| Wishlist of product slugs | `wishlist_items.product_id` |
| `ShippingDetails` | many `addresses`, plus a JSON snapshot on the order |
| `PaymentMethod` `cod`, `bank`, `card` | `payments.method`. Provider is `cash_on_delivery`, `bank_transfer`, or `card`, not a gateway name. |
| `cardLast4` | `payments.card_last4`. The full card number has no column. |
| Order id `LJ-#####` | `orders.number` |
| Tracking `LX-#####` | `shipments.tracking` |
| Cities and transit days in `lib/shipment.ts` | `shipping_zone_cities` |
| Shipping fee 0 | `shipping_rates.fee = 0` for standard delivery |
| Review quotes in `lib/content.ts` | `reviews`. The seed used by tests inserts real rows. Rating on a card should later be the average of published reviews, not the static number in the catalog file. |

## Tables

Identity: `profiles`, `addresses`.

Catalog: `brands`, `categories`, `collections`, `products`, `product_categories`, `collection_products`, `product_media`, `product_details`, `product_tags`, `variants`.

Stock: `inventory_levels`, `inventory_reservations`, `inventory_transactions`.

Commerce: `carts`, `cart_items`, `wishlists`, `wishlist_items`, `coupons`, `coupon_products`, `coupon_categories`, `coupon_redemptions`.

Orders: `orders`, `order_items`, `order_status_history`, `payments`, `shipments`.

Shipping reference: `shipping_zones`, `shipping_zone_cities`, `shipping_methods`, `shipping_rates`.

Other: `reviews`, `audit_log`, `cache_versions`.

`orders.total = subtotal - discount + shipping_fee + tax`. `order_items.total = unit_price * quantity - discount + tax`. Available stock is `on_hand - reserved`, and `reserved` cannot exceed `on_hand`.

## Relationships

- A profile has many addresses, one cart, one wishlist, and many orders.
- A product belongs to one brand, one primary category, any number of extra categories, collections, tags, details, and media.
- A variant belongs to one product. SKU is unique. `(product_id, metal, size)` is unique.
- Inventory, reservations, and ledger rows point at a variant.
- A cart is either a customer cart or a guest cart, never both. A cart item points at one variant.
- An order snapshots address, SKU, name, variant label, image, and unit price. Product and variant ids remain for joins, but the snapshot columns are what a past order displays.
- A payment points at an order. A shipment points at an order. Status history is append-only.

## Inventory and checkout

Stock is not a column the client updates.

`reserve_inventory` locks the inventory row, checks `on_hand - reserved`, and increases `reserved`. The same idempotency key returns the existing hold. A second hold on the last unit raises `insufficient_stock`.

`release_reservation` and `expire_reservations` put that quantity back and write `reservation_release`. Deleting a cart releases its holds. Locks are taken on the inventory row before the reservation row so checkout and expiry do not deadlock.

`place_order` locks the cart, locks each inventory row in variant id order, and then either commits a matching hold or sells from available stock. Price, shipping fee, and coupon discount are calculated inside the function. The same idempotency key returns the original order and does not sell again. Two checkouts of one remaining unit: one commits, the other gets `insufficient_stock`, and `on_hand` stays at zero.

`cancel_order` is allowed only before payment is captured and before the order is processing. It returns the units through the ledger.

`adjust_inventory` is the staff path for restock, purchase, damage, return, adjustment, and manual correction. Sale and reservation are not accepted there.

`inventory_transactions`, `order_items`, and `order_status_history` reject update and delete.

## Orders, payments, shipping

Order numbers come from `order_number_seq`, formatted `LJ-10000` upward. Gaps are normal because a rolled-back checkout still consumes a sequence value.

Payment provider is text, so a later gateway does not require a new order column. Duplicate processing is blocked by `payments.idempotency_key` and by a unique `(provider, provider_ref)` when a provider reference exists.

Shipping is a method, a zone, a city transit time, and a rate. Standard delivery to the ten storefront cities is fee 0. Changing the fee does not require a migration. Each order gets one shipment. Status moves through `set_order_status`: created, confirmed, processing, shipped, delivered, cancelled, returned, refunded. Skipping a step is rejected.

Coupons support percent or fixed amount, minimum subtotal, maximum discount, dates, a global usage limit, a per-customer limit, and optional product or category restrictions. `WELCOME10` is 10 percent, minimum 20,000 PKR, maximum discount 8,000 PKR.

## Security

Row level security is enabled on every table above. Customer policies compare `(select auth.uid())` so the id is planned once. Staff and admin are `profiles.role`, checked by `is_staff()` and `is_admin()`. A customer cannot change their own role; the profile trigger requires an admin or the migration role.

`anon` and `authenticated` can read active catalog rows. They can read `inventory_levels.available` only. They cannot read `cost_price`. They cannot insert orders, payments, or ledger rows. Checkout functions are `security definer` and re-check the cart: the caller must own it, present the guest token, or be the service role.

Guest carts match `x-cart-token` to `carts.guest_token`. The token is a bearer secret. `claim_guest_cart` attaches it to the signed-in customer.

`service_role` bypasses RLS and is the only role that should run staff stock adjustments from a future server. It must not be shipped to the browser.

Direct grants also block abuse when a policy is wide: there is no `UPDATE` grant on inventory for the storefront roles.

## Indexes

Each index is there for a lookup that showed up in the storefront or in checkout. Unique constraints that already start with the right column are not duplicated.

| Index | Why |
| --- | --- |
| `products.slug`, `products.sku` unique | Product page and style code |
| `products_active_recent` | Active listing ordered by `published_at`, `id` |
| `products_search` GIN | Full-text name, SKU, gemstone, material, purity, type, description |
| `products_name_trgm` GIN | Storefront search is a substring match, which full-text does not cover |
| `product_categories` primary key | Products for a category membership check |
| `product_one_primary_category` | One primary category |
| `product_categories_by_category` | Count or list by category |
| `variants (product_id, metal, size)` unique | Cart identity and the metal filter after a product is known |
| `variants.sku` unique | SKU lookup. This is the sellable code |
| `variants_metal_active` | Active variants of one metal |
| `variants_metal_trgm` | Substring search on metal names such as "rose" |
| `addresses` partial unique | One default shipping and one default billing address |
| `inventory_levels` primary key | Stock lookup by variant |
| `reservations_one_hold` | One open hold per cart and variant |
| `reservations_held_variant`, `reservations_held_expiry` | Release and expiry of open holds |
| `inventory_tx_variant` | Ledger history for one variant |
| `carts.customer_id`, `carts.guest_token` unique | Find the open cart |
| `cart_items (cart_id, variant_id)` unique | Load a cart and reject duplicate lines |
| `wishlists.customer_id` unique and items primary key | Load one wishlist |
| `orders.number`, `orders.idempotency_key` unique | Order page and replay |
| `orders_customer_recent` | Account order history |
| `orders_open` | Created, confirmed, processing, shipped queue |
| `order_items.order_id` | Items for one order |
| `order_status_history.order_id` | Tracking timeline |
| `payments` idempotency and provider reference | Do not capture twice |
| `reviews (product_id, customer_id)` unique | One review per customer per product |
| `reviews_published` | Published reviews for a product |
| `audit_entity`, `audit_recent` | Audit by record and by time |
| `shipping_zone_cities.city` unique | Fee and transit lookup |

`categories` has 10 rows, so its slug filter is a sequential scan on purpose.

## Cache boundaries

PostgreSQL is the source of truth. Redis is not part of this phase. `cache_versions.catalog` increments when products, variants, categories, or collections change. A later cache key should include that version.

Cache-friendly, after the version is part of the key:

- `product:{id}`
- `product:slug:{slug}`
- `category:{slug}`
- `collection:{slug}`
- `featured-products:{version}` for the `new` tag
- `search:{query}:{version}`

Do not cache as authority, even for a few seconds, without accepting stale stock or money:

- inventory and reservations
- carts and checkout
- payments
- orders and order status while fulfillment is open

Public product text can be cached. The price used to charge the customer must be read again inside `place_order`.

## Connections

A future Node server should use the Supabase pooler, not a new Postgres session per request.

- Serverless and short queries: transaction pooler, port 6543. Disable prepared statements (`pg` `prepare: false`, Prisma `?pgbouncer=true`).
- Migrations, seeds, and `listen/notify`: session port 5432, from a trusted machine.
- Pool size in the app should stay small, on the order of 5–20 connections per instance, because the pooler is what multiplexes them.
- The service role key stays in server environment variables.

## Migrations, backup, and growth

Apply `supabase/migrations` in filename order, then `supabase/seed.sql` for the real catalog. Do not run `tests/scale.sql` on production. It inserts thousands of bench rows.

`outbox` stores events written in the same transaction as the order, cancellation, payment update, or new profile. A worker delivers them. Clients cannot read this table. It is not a second copy of the order.

```text
local -> staging -> production
```

On a linked Supabase project the CLI command is `supabase db reset` for local and `supabase db push` for the remote. This workspace did not have the CLI or a hosted project, so the commands that were actually run are in `DATABASE-PERFORMANCE.md`.

Rollback is a forward migration that drops or alters what the bad migration added. Do not edit a migration that has already been applied to staging or production.

Backups and point-in-time recovery are project settings in Supabase. They are not enabled by these files. Before production: turn on daily backups and PITR, restore a backup onto a scratch project, and record the time you actually achieved. Until that restore has been done, disaster recovery is not in place.

Tables are not partitioned. Partition `inventory_transactions` and `order_items` by month only after they are large enough that vacuum or index size shows up in production, roughly tens of millions of rows. Order snapshots stay in the primary database; they are the history. Old ledger rows can move to an archive table later.

The schema is shaped for 1M customers, 100k products, and millions of orders by using indexed lookups, keyset-friendly ordering (`published_at`, `id`), append-only history, and functions that lock one stock row. That is a path, not a measured limit.

## Commands

Local proof, from `database/`:

```text
npm install
node tests/run.mjs
```

`npm install` needs the `embedded-postgres` postinstall script so the Windows binaries are usable. The test cluster listens on `127.0.0.1:54329`, uses user `postgres` / password `postgres`, and deletes its data on shutdown. That password is only for this disposable cluster.

Hosted or CLI, when those exist:

```text
supabase start
supabase db reset
```

Verify a catalog page without loading every product:

```sql
select id, slug, name
from products
where status = 'active'
order by published_at desc, id desc
limit 24;
```

Verify one product:

```sql
select slug, name from products where slug = 'royal-sparkle-ring';
```

## Phase 2, not started

- Sign-in through Supabase Auth and a profile row created by `handle_new_user`.
- A server-side module that calls `place_order`, `reserve_inventory`, and `cancel_order`. The browser never receives the service role key and never sends a price.
- Replace the `luxe-jewels-v1` local cart only at that boundary. Guest token maps to `carts.guest_token`.
- Payment provider webhooks that set `payments.provider_ref` and status. The order total still comes from the order row.
- Staff stock and order screens can call `adjust_inventory` and `set_order_status`.
- Redis only after listing latency or database CPU says the catalog reads are the bottleneck.
