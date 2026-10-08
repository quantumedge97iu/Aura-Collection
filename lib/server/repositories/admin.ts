import type { Db } from "../db";
import { rows } from "../db";

export async function listOrders(db: Db, status: string | null, limit: number) {
  return rows(db, `
    select id, number, email, status, payment_status, total, currency, created_at
    from orders
    where ($1::text is null or status::text = $1)
    order by created_at desc
    limit $2
  `, [status, limit]);
}

export async function setOrderStatus(db: Db, orderId: string, status: string, reason: string) {
  await rows(db, "select set_order_status($1, $2::order_status, $3)", [orderId, status, reason]);
}

export async function adjustInventory(db: Db, variantId: string, type: string, delta: number, note: string) {
  await rows(db, "select adjust_inventory($1, $2::inventory_tx_type, $3, $4)", [variantId, type, delta, note]);
}

export async function expireReservations(db: Db) {
  const found = await rows<{ expire_reservations: number }>(db, "select expire_reservations()");
  return found[0]?.expire_reservations ?? 0;
}

export async function setPayment(db: Db, paymentId: string, status: string, providerRef: string | null) {
  const found = await rows<{ order_id: string }>(db, `
    update payments set status = $2::payment_status, provider_ref = coalesce($3, provider_ref) where id = $1 returning order_id
  `, [paymentId, status, providerRef]);
  if (!found[0]) return null;
  await rows(db, "update orders set payment_status = $2::payment_status where id = $1", [found[0].order_id, status]);
  return { orderId: found[0].order_id, status };
}

export async function setReviewStatus(db: Db, reviewId: string, status: string) {
  const found = await rows(db, "update reviews set status = $2::review_status where id = $1 returning id", [reviewId, status]);
  return found.length > 0;
}

export async function createCoupon(db: Db, input: { code: string; discountType: string; amount: number; minSubtotal: number; maxDiscount: number | null; usageLimit: number | null; perCustomerLimit: number }) {
  await rows(db, `
    insert into coupons (code, discount_type, amount, min_subtotal, max_discount, usage_limit, per_customer_limit)
    values ($1, $2::discount_type, $3, $4, $5, $6, $7)
  `, [input.code, input.discountType, input.amount, input.minSubtotal, input.maxDiscount, input.usageLimit, input.perCustomerLimit]);
}

export async function audit(db: Db, entity: string | null, limit: number) {
  return rows(db, `
    select id, at, actor_id, action, entity, entity_id, summary
    from audit_log
    where ($1::text is null or entity = $1)
    order by at desc, id desc
    limit $2
  `, [entity, limit]);
}

export async function customers(db: Db, limit: number) {
  return rows(db, "select id, full_name, phone, status, role, created_at from profiles order by created_at desc limit $1", [limit]);
}

export async function setRole(db: Db, profileId: string, role: string) {
  const found = await rows(db, "update profiles set role = $2::app_role where id = $1 returning id, role", [profileId, role]);
  return found[0] ?? null;
}

export async function createProduct(db: Db, actorId: string, input: {
  slug: string;
  name: string;
  description: string;
  sku: string;
  productType: string;
  categorySlug: string;
  imageUrl?: string | null;
  variants: { sku: string; metal: string; size: string; price: number; stock: number }[];
}) {
  const brand = await rows<{ id: string }>(db, "select id from brands where slug = 'luxe-jewels'");
  const category = await rows<{ id: string }>(db, "select id from categories where slug = $1", [input.categorySlug]);
  if (!brand[0] || !category[0]) return null;
  const product = await rows<{ id: string }>(db, `
    insert into products (brand_id, slug, name, description, sku, product_type, material, metal_family, status, image_url)
    values ($1, $2, $3, $4, $5, $6, 'Gold', 'Gold', 'active', $7)
    returning id
  `, [brand[0].id, input.slug, input.name, input.description, input.sku, input.productType, input.imageUrl ?? null]);
  await rows(db, "insert into product_categories (product_id, category_id, is_primary) values ($1, $2, true)", [product[0].id, category[0].id]);
  for (const variant of input.variants) {
    const created = await rows<{ id: string }>(db, `
      insert into variants (product_id, sku, metal, size, price, currency, status)
      values ($1, $2, $3, $4, $5, 'PKR', 'active') returning id
    `, [product[0].id, variant.sku, variant.metal, variant.size, variant.price, ]);
    await rows(db, "insert into inventory_levels (variant_id, on_hand, reorder_at) values ($1, $2, 2)", [created[0].id, variant.stock]);
    if (variant.stock > 0) {
      await rows(db, `
        insert into inventory_transactions (variant_id, tx_type, quantity, on_hand_after, reserved_after, actor_id, note)
        values ($1, 'purchase', $2, $2, 0, $3, 'opening stock')
      `, [created[0].id, variant.stock, actorId]);
    }
  }
  return product[0].id;
}

export async function updateProduct(db: Db, slug: string, patch: { name?: string; description?: string; status?: string }) {
  const found = await rows(db, `
    update products set
      name = coalesce($2, name),
      description = coalesce($3, description),
      status = coalesce($4::product_status, status)
    where slug = $1
    returning id, slug, name, status
  `, [slug, patch.name ?? null, patch.description ?? null, patch.status ?? null]);
  return found[0] ?? null;
}

export async function variantCost(db: Db, variantId: string) {
  const found = await rows(db, "select id, sku, price, cost_price, metal, size from variants where id = $1", [variantId]);
  return found[0] ?? null;
}
