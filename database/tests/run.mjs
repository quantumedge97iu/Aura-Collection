import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import EmbeddedPostgres from "embedded-postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 54329;
const database = "luxe";
const connectionString = `postgresql://postgres:postgres@127.0.0.1:${port}/${database}`;
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
  console.log(`${condition ? "ok" : "FAIL"}  ${message}`);
}

function percentile(samples, p) {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function execFile(client, file) {
  await client.query(readFileSync(join(root, file), "utf8"));
}

async function main() {
  const embedded = new EmbeddedPostgres({
    databaseDir: join(root, "pgdata"),
    user: "postgres",
    password: "postgres",
    port,
    persistent: false,
  });

  console.log("starting local postgres");
  await embedded.initialise();
  await embedded.start();
  await embedded.createDatabase(database);

  const client = new pg.Client({ connectionString });
  await client.connect();
  const started = Date.now();

  try {
    for (const file of [
      "supabase/migrations/20261007120000_schema.sql",
      "supabase/migrations/20261007120100_functions.sql",
      "supabase/migrations/20261007120200_rls.sql",
      "supabase/migrations/20261007120300_outbox.sql",
      "supabase/migrations/20261009120000_read_model.sql",
      "supabase/migrations/20261009130000_profile_avatars.sql",
      "supabase/migrations/20261009140000_profile_details.sql",
      "supabase/seed.sql",
    ]) {
      console.log(`applying ${file}`);
      await execFile(client, file);
    }

    const counts = await client.query(`
      select
        (select count(*) from products where slug not like 'bench-%')::int as products,
        (select count(*) from variants where sku like 'LJ-%')::int as variants,
        (select count(*) from categories)::int as categories,
        (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'password')::int as password_columns
    `);
    check(counts.rows[0].products === 13, "seed loads the 13 storefront products");
    check(counts.rows[0].variants === 86, "each metal and size is its own sku");
    check(counts.rows[0].categories === 10, "storefront categories are present");
    check(counts.rows[0].password_columns === 0, "profiles do not store a password");

    const ayesha = "11111111-1111-4111-8111-111111111111";
    const fatima = "22222222-2222-4222-8222-222222222222";
    await client.query(
      `insert into profiles (id, full_name, phone) values ($1, 'Ayesha Khan', '03001234567'), ($2, 'Fatima Rizwan', '03007654321')`,
      [ayesha, fatima],
    );
    await client.query(
      `insert into addresses (customer_id, full_name, phone, line1, city, province, postal_code, is_default_shipping, is_default_billing)
       values ($1, 'Ayesha Khan', '03001234567', '12 Zamzama', 'Karachi', 'Sindh', '75500', true, true)`,
      [ayesha],
    );
    await client.query(
      `insert into reviews (product_id, customer_id, rating, title, body, status, verified)
       select p.id, $1, 5, 'Stunning', 'The ring is even more beautiful in person.', 'published', true
       from products p where p.slug = 'royal-sparkle-ring'`,
      [ayesha],
    );

    const variant = await client.query(
      `select id, price from variants where sku = 'LJ-RG-048-YG-12'`,
    );
    const variantId = variant.rows[0].id;
    const catalogPrice = variant.rows[0].price;

    const cart = await client.query(`insert into carts (customer_id) values ($1) returning id`, [ayesha]);
    const cartId = cart.rows[0].id;
    await client.query(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 1)`, [cartId, variantId]);

    let duplicateFailed = false;
    try {
      await client.query(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 1)`, [cartId, variantId]);
    } catch {
      duplicateFailed = true;
    }
    check(duplicateFailed, "a cart cannot contain the same variant twice");

    let negativeFailed = false;
    try {
      await client.query(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 0)`, [cartId, variantId]);
    } catch {
      negativeFailed = true;
    }
    check(negativeFailed, "cart quantity cannot be zero");

    const orderId = (await client.query(
      `select place_order($1, $2, $3::jsonb, 'cod', $4, 'WELCOME10') as id`,
      [cartId, "ayesha@example.com", JSON.stringify({
        name: "Ayesha Khan",
        phone: "03001234567",
        city: "Karachi",
        address: "12 Zamzama",
        notes: "",
      }), "checkout-ayesha-1"],
    )).rows[0].id;

    const order = await client.query(
      `select o.number, o.subtotal, o.discount, o.total, o.shipping_address->>'city' as city,
              i.unit_price, i.product_name, i.sku, s.tracking
       from orders o
       join order_items i on i.order_id = o.id
       join shipments s on s.order_id = o.id
       where o.id = $1`,
      [orderId],
    );
    const row = order.rows[0];
    check(row.unit_price === catalogPrice, "order item stores the database price");
    check(row.subtotal === catalogPrice, "subtotal comes from the variant price");
    check(row.discount === Math.floor(catalogPrice * 10 / 100), "percent coupon is calculated in the database");
    check(row.total === row.subtotal - row.discount, "order total is subtotal minus discount");
    check(row.city === "Karachi", "shipping address is snapshotted");
    check(row.tracking === `LX-${row.number.slice(3)}`, "tracking number follows the storefront shape");

    await client.query(`update variants set price = price + 1000 where id = $1`, [variantId]);
    await client.query(`update products set name = 'Renamed Ring' where slug = 'royal-sparkle-ring'`);
    const snapshot = await client.query(`select unit_price, product_name from order_items where order_id = $1`, [orderId]);
    check(snapshot.rows[0].unit_price === catalogPrice && snapshot.rows[0].product_name === "Royal Sparkle Ring", "later catalog edits do not rewrite the order");
    await client.query(`update products set name = 'Royal Sparkle Ring' where slug = 'royal-sparkle-ring'`);
    await client.query(`update variants set price = $2 where id = $1`, [variantId, catalogPrice]);

    const replay = await client.query(`select place_order($1, 'ayesha@example.com', '{"name":"A","phone":"1","city":"Karachi","address":"1"}'::jsonb, 'cod', 'checkout-ayesha-1') as id`, [cartId]);
    const sold = await client.query(`select sold from inventory_levels where variant_id = $1`, [variantId]);
    check(replay.rows[0].id === orderId && sold.rows[0].sold === 1, "replaying the same checkout key does not sell twice");

    const holdVariant = (await client.query(`select id from variants where sku = 'LJ-GB-185-24K-5g'`)).rows[0].id;
    await client.query(`update inventory_levels set on_hand = 1, reserved = 0, sold = 0 where variant_id = $1`, [holdVariant]);
    const holdCart = (await client.query(`insert into carts (customer_id) values ($1) returning id`, [fatima])).rows[0].id;
    const otherCart = (await client.query(`insert into carts (guest_token) values ($1) returning id`, [randomUUID()])).rows[0].id;
    const hold = await client.query(
      `select reserve_inventory($1, 1, 'hold-fatima', $2, interval '15 minutes') as id`,
      [holdVariant, holdCart],
    );
    let secondHoldFailed = false;
    try {
      await client.query(`select reserve_inventory($1, 1, 'hold-other', $2, interval '15 minutes')`, [holdVariant, otherCart]);
    } catch (error) {
      secondHoldFailed = String(error.message).includes("insufficient_stock");
    }
    check(secondHoldFailed, "a second hold cannot take the last reserved unit");
    await client.query(`select release_reservation($1)`, [hold.rows[0].id]);
    const released = await client.query(`select available from inventory_levels where variant_id = $1`, [holdVariant]);
    check(released.rows[0].available === 1, "releasing a hold returns the unit");

    await client.query(`update inventory_levels set on_hand = 1, reserved = 0, sold = 0 where variant_id = $1`, [holdVariant]);
    const raceA = (await client.query(`insert into carts (guest_token) values ($1) returning id`, [randomUUID()])).rows[0].id;
    const raceB = (await client.query(`insert into carts (guest_token) values ($1) returning id`, [randomUUID()])).rows[0].id;
    await client.query(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 1), ($3, $2, 1)`, [raceA, holdVariant, raceB]);
    const shipping = JSON.stringify({ name: "Buyer", phone: "03001112222", city: "Lahore", address: "Mall Road", notes: "" });
    const left = new pg.Client({ connectionString });
    const right = new pg.Client({ connectionString });
    await left.connect();
    await right.connect();
    const race = await Promise.allSettled([
      left.query(`select place_order($1, 'a@example.com', $2::jsonb, 'card', 'race-buyer-a', null, '4242') as id`, [raceA, shipping]),
      right.query(`select place_order($1, 'b@example.com', $2::jsonb, 'bank', 'race-buyer-b') as id`, [raceB, shipping]),
    ]);
    await left.end();
    await right.end();
    const wins = race.filter((item) => item.status === "fulfilled").length;
    const stockErrors = race.filter((item) => item.status === "rejected" && String(item.reason?.message).includes("insufficient_stock")).length;
    const after = await client.query(`select on_hand, reserved, sold, available from inventory_levels where variant_id = $1`, [holdVariant]);
    check(wins === 1 && stockErrors === 1, "only one of two concurrent checkouts gets the last unit");
    check(after.rows[0].on_hand === 0 && after.rows[0].sold === 1 && after.rows[0].available === 0, "stock cannot go negative");
    if (wins !== 1 || stockErrors !== 1) {
      console.log(race.map((item) => item.status === "fulfilled" ? "fulfilled" : item.reason?.message));
    }

    let ledgerLocked = false;
    try {
      await client.query(`update inventory_transactions set note = 'changed' where id = (select min(id) from inventory_transactions)`);
    } catch (error) {
      ledgerLocked = String(error.message).includes("append-only");
    }
    check(ledgerLocked, "inventory history cannot be edited");

    await client.query(`insert into wishlists (customer_id) values ($1)`, [ayesha]);
    await client.query(
      `insert into wishlist_items (wishlist_id, product_id)
       select w.id, p.id from wishlists w, products p
       where w.customer_id = $1 and p.slug = 'pearl-drop-earrings'`,
      [ayesha],
    );

    const isolated = new pg.Client({ connectionString });
    await isolated.connect();
    await isolated.query("begin");
    await isolated.query(`select set_config('request.jwt.claim.sub', $1, true)`, [fatima]);
    await isolated.query(`select set_config('request.jwt.claim.role', 'authenticated', true)`);
    await isolated.query("set local role authenticated");
    const foreignOrders = await isolated.query(`select id from orders where customer_id = $1`, [ayesha]);
    const ownWish = await isolated.query(`select product_id from wishlist_items`);
    let costDenied = false;
    await isolated.query("savepoint probe");
    try {
      await isolated.query(`select cost_price from variants limit 1`);
    } catch (error) {
      costDenied = String(error.message).includes("permission denied");
      await isolated.query("rollback to savepoint probe");
    }
    let stockWriteDenied = false;
    try {
      await isolated.query(`update inventory_levels set on_hand = 0 where variant_id = $1`, [variantId]);
    } catch (error) {
      stockWriteDenied = String(error.message).includes("permission denied");
    }
    await isolated.query("rollback");
    await isolated.end();
    check(foreignOrders.rows.length === 0, "a customer cannot read another customer's orders");
    check(ownWish.rows.length === 0, "a customer cannot read another customer's wishlist");
    check(costDenied, "cost price is not granted to the storefront role");
    check(stockWriteDenied, "a customer cannot write inventory directly");

    console.log("loading bench catalog");
    const scaleStarted = Date.now();
    await execFile(client, "tests/scale.sql");
    const scaleMs = Date.now() - scaleStarted;
    const volume = await client.query(`
      select
        (select count(*) from products)::int as products,
        (select count(*) from variants)::int as variants,
        (select count(*) from orders)::int as orders,
        (select count(*) from profiles)::int as customers
    `);
    console.log(`bench load ${scaleMs}ms`, volume.rows[0]);

    const plans = {};
    const explained = [
      ["product listing", `select p.id, p.slug, p.name from products p where p.status = 'active' order by p.published_at desc, p.id desc limit 24`],
      ["product detail", `select p.id, p.slug, p.name, p.description from products p where p.slug = 'royal-sparkle-ring'`],
      ["category listing", `select p.id, p.slug from products p join product_categories pc on pc.product_id = p.id join categories c on c.id = pc.category_id where p.status = 'active' and c.slug = 'rings' order by p.published_at desc, p.id desc limit 24`],
      ["metal filter", `select p.id from products p join product_categories pc on pc.product_id = p.id join categories c on c.id = pc.category_id and c.slug = 'rings' where p.status = 'active' and exists (select 1 from variants v where v.product_id = p.id and v.metal = 'Yellow Gold' and v.status = 'active') order by p.published_at desc, p.id desc limit 24`],
      ["search", `select p.id, p.slug from products p where p.status = 'active' and p.search_vector @@ plainto_tsquery('simple', 'diamond') order by p.published_at desc, p.id desc limit 24`],
      ["sku lookup", `select id from variants where sku = 'LJ-RG-048-YG-12'`],
      ["inventory lookup", `select available from inventory_levels where variant_id = '${holdVariant}'`],
      ["order history", `select id, number, total from orders where customer_id = '${ayesha}' order by created_at desc limit 20`],
      ["cart", `select quantity from cart_items where cart_id = '${raceA}'`],
      ["wishlist", `select product_id from wishlist_items wi join wishlists w on w.id = wi.wishlist_id where w.customer_id = '${ayesha}'`],
      ["search rare", `select p.id from products p where p.search_vector @@ plainto_tsquery('simple', '007777') limit 24`],
      ["category count", `select count(*) from product_categories pc join categories c on c.id = pc.category_id where c.slug = 'rings'`],
      ["metal catalog", `select product_id from variants where metal = 'Yellow Gold' and status = 'active' limit 24`],
      ["open orders", `select id from orders where status = 'created' order by created_at desc limit 20`],
    ];
    for (const [label, sql] of explained) {
      const result = await client.query(`explain (analyze, buffers) ${sql}`);
      plans[label] = result.rows.map((line) => line["QUERY PLAN"]).join("\n");
      console.log(`\n# ${label}\n${plans[label]}`);
    }

    const samples = [];
    const listSql = `select p.id, p.slug, p.name, p.image_url from products p where p.status = 'active' order by p.published_at desc, p.id desc limit 24`;
    for (let i = 0; i < 20; i += 1) await client.query(listSql);
    for (let i = 0; i < 200; i += 1) {
      const t0 = performance.now();
      await client.query(listSql);
      samples.push(performance.now() - t0);
    }

    async function burst(concurrency, rounds) {
      const pool = new pg.Pool({ connectionString, max: concurrency });
      const times = [];
      for (let round = 0; round < rounds; round += 1) {
        const t0 = performance.now();
        await Promise.all(Array.from({ length: concurrency }, () => pool.query(listSql)));
        times.push(performance.now() - t0);
      }
      await pool.end();
      const elapsed = times.reduce((sum, value) => sum + value, 0);
      return {
        concurrency,
        rounds,
        queries: concurrency * rounds,
        elapsedMs: Math.round(elapsed),
        qps: Number(((concurrency * rounds) / (elapsed / 1000)).toFixed(1)),
      };
    }

    const load = [await burst(20, 10), await burst(50, 4)];
    console.log("load", load);

    const detailPlan = plans["product detail"];
    const skuPlan = plans["sku lookup"];
    check(/Index (Only )?Scan|Bitmap Index Scan/.test(detailPlan), "product slug lookup uses an index");
    check(/Index (Only )?Scan|Bitmap Index Scan/.test(skuPlan), "sku lookup uses an index");

    const summary = {
      elapsedMs: Date.now() - started,
      scaleMs,
      volume: volume.rows[0],
      listingMs: {
        samples: samples.length,
        p50: Number(percentile(samples, 50).toFixed(2)),
        p95: Number(percentile(samples, 95).toFixed(2)),
        p99: Number(percentile(samples, 99).toFixed(2)),
        avg: Number((samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(2)),
      },
      load,
      plans,
      failures,
    };
    mkdirSync(join(root, "tests/results"), { recursive: true });
    writeFileSync(join(root, "tests/results/summary.json"), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify({ listingMs: summary.listingMs, load, failures }, null, 2));
  } finally {
    await client.end();
    await embedded.stop();
  }

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
