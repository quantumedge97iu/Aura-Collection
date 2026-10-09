import type { Db } from "../db";
import { rows } from "../db";

export async function findCart(db: Db, id: string) {
  const found = await rows<{ id: string; customer_id: string | null; guest_token: string | null }>(db, "select id, customer_id, guest_token from carts where id = $1", [id]);
  return found[0] ?? null;
}

export async function createGuestCart(db: Db, token: string) {
  const found = await rows<{ id: string }>(db, "insert into carts (guest_token) values ($1) returning id", [token]);
  return found[0].id;
}

export async function customerCart(db: Db, customerId: string) {
  const found = await rows<{ id: string }>(db, `
    insert into carts (customer_id) values ($1)
    on conflict (customer_id) do update set updated_at = now()
    returning id
  `, [customerId]);
  return found[0].id;
}

export async function cartItems(db: Db, cartId: string) {
  return rows(db, `
    select v.id as variant_id, v.sku, v.metal, v.size, v.price, p.slug, p.name, p.image_url, ci.quantity, i.available
    from cart_items ci
    join variants v on v.id = ci.variant_id
    join products p on p.id = v.product_id
    join inventory_levels i on i.variant_id = v.id
    where ci.cart_id = $1
    order by ci.created_at, v.sku
  `, [cartId]);
}

export async function addCartItem(db: Db, cartId: string, variantId: string, quantity: number) {
  await rows(db, `
    insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, $3)
    on conflict (cart_id, variant_id) do update set quantity = least(8, cart_items.quantity + excluded.quantity)
  `, [cartId, variantId, quantity]);
}

export async function setCartQty(db: Db, cartId: string, variantId: string, quantity: number) {
  await rows(db, "update cart_items set quantity = $3 where cart_id = $1 and variant_id = $2", [cartId, variantId, quantity]);
}

export async function removeCartItem(db: Db, cartId: string, variantId: string) {
  await rows(db, "delete from cart_items where cart_id = $1 and variant_id = $2", [cartId, variantId]);
}

export async function variantForSale(db: Db, variantId: string) {
  const found = await rows<{ id: string; status: string; product_status: string; available: number }>(db, `
    select v.id, v.status, p.status as product_status, i.available
    from variants v
    join products p on p.id = v.product_id
    join inventory_levels i on i.variant_id = v.id
    where v.id = $1
  `, [variantId]);
  return found[0] ?? null;
}

export async function claimGuestCart(db: Db, token: string) {
  const found = await rows<{ claim_guest_cart: string | null }>(db, "select claim_guest_cart($1)", [token]);
  return found[0]?.claim_guest_cart ?? null;
}

export async function wishlistId(db: Db, customerId: string) {
  const found = await rows<{ id: string }>(db, `
    insert into wishlists (customer_id) values ($1)
    on conflict (customer_id) do update set customer_id = excluded.customer_id
    returning id
  `, [customerId]);
  return found[0].id;
}

export async function wishlistItems(db: Db, customerId: string) {
  return rows(db, `
    select p.id, p.slug, p.name, p.image_url,
      (select min(v.price) from variants v where v.product_id = p.id and v.status = 'active') as price,
      coalesce((select json_agg(distinct v.metal) from variants v where v.product_id = p.id and v.status = 'active'), '[]'::json) as metals,
      (select json_build_object('id', v.id, 'sku', v.sku, 'metal', v.metal, 'size', v.size, 'price', v.price, 'available', i.available)
       from variants v join inventory_levels i on i.variant_id = v.id
       where v.product_id = p.id and v.status = 'active'
       order by v.price, v.metal, v.size limit 1) as default_variant
    from wishlists w
    join wishlist_items wi on wi.wishlist_id = w.id
    join products p on p.id = wi.product_id
    where w.customer_id = $1
    order by wi.created_at desc
  `, [customerId]);
}

export async function addWish(db: Db, customerId: string, productId: string) {
  const id = await wishlistId(db, customerId);
  await rows(db, "insert into wishlist_items (wishlist_id, product_id) values ($1, $2) on conflict do nothing", [id, productId]);
}

export async function removeWish(db: Db, customerId: string, productId: string) {
  await rows(db, `
    delete from wishlist_items wi using wishlists w
    where wi.wishlist_id = w.id and w.customer_id = $1 and wi.product_id = $2
  `, [customerId, productId]);
}

export async function activeProductId(db: Db, productId: string) {
  const found = await rows<{ id: string }>(db, "select id from products where id = $1 and status = 'active'", [productId]);
  return found[0]?.id ?? null;
}

export async function placeOrder(db: Db, input: { cartId: string; email: string; shipping: unknown; method: string; idempotencyKey: string; coupon: string | null; cardLast4: string | null }) {
  const found = await rows<{ id: string }>(db, "select place_order($1, $2, $3::jsonb, $4, $5, $6, $7) as id", [
    input.cartId, input.email, JSON.stringify(input.shipping), input.method, input.idempotencyKey, input.coupon, input.cardLast4,
  ]);
  return found[0].id;
}

export async function orderById(db: Db, id: string) {
  const orders = await rows(db, `
    select o.id, o.number, o.customer_id, o.email, o.status, o.payment_status, o.fulfillment_status,
           o.subtotal, o.discount, o.shipping_fee, o.tax, o.total, o.currency, o.shipping_address,
           o.billing_address, o.notes, o.created_at
    from orders o where o.id = $1
  `, [id]);
  if (!orders[0]) return null;
  return hydrate(db, orders[0]);
}

export async function orderByNumber(db: Db, number: string, email: string) {
  const orders = await rows(db, `
    select o.id, o.number, o.customer_id, o.email, o.status, o.payment_status, o.fulfillment_status,
           o.subtotal, o.discount, o.shipping_fee, o.tax, o.total, o.currency, o.shipping_address,
           o.billing_address, o.notes, o.created_at
    from orders o where o.number = $1 and lower(o.email) = lower($2)
  `, [number, email]);
  if (!orders[0]) return null;
  return hydrate(db, orders[0]);
}

export async function ordersForCustomer(db: Db, customerId: string, limit: number) {
  return rows(db, `
    select o.id, o.number, o.status, o.payment_status, o.total, o.currency, o.created_at,
      o.shipping_address ->> 'city' as city,
      (select p.method from payments p where p.order_id = o.id order by p.created_at desc limit 1) as method
    from orders o where o.customer_id = $1
    order by o.created_at desc limit $2
  `, [customerId, limit]);
}

async function hydrate(db: Db, order: Record<string, unknown>) {
  const items = await rows(db, "select sku, product_name, variant_label, image_url, unit_price, quantity, discount, tax, total from order_items where order_id = $1", [order.id]);
  const payments = await rows(db, "select id, provider, method, status, amount, currency, card_last4, provider_ref from payments where order_id = $1", [order.id]);
  const shipment = await rows(db, "select carrier, tracking, status, eta from shipments where order_id = $1", [order.id]);
  const history = await rows(db, "select old_status, new_status, source, reason, created_at from order_status_history where order_id = $1 order by created_at, id", [order.id]);
  return { ...order, items, payment: payments[0] ?? null, shipment: shipment[0] ?? null, history };
}

export async function cancelOrder(db: Db, orderId: string, reason: string) {
  await rows(db, "select cancel_order($1, $2)", [orderId, reason]);
}

export async function cartSubtotal(db: Db, cartId: string) {
  const found = await rows<{ subtotal: string | number | null }>(db, `
    select coalesce(sum(v.price * ci.quantity), 0) as subtotal
    from cart_items ci join variants v on v.id = ci.variant_id
    where ci.cart_id = $1
  `, [cartId]);
  return Number(found[0]?.subtotal ?? 0);
}

export async function findCoupon(db: Db, code: string) {
  const found = await rows<{ discount_type: "percent" | "fixed"; amount: number; min_subtotal: number; max_discount: number | null; active: boolean }>(db, `
    select discount_type, amount, min_subtotal, max_discount, active
    from coupons
    where code = $1 and active and starts_at <= now() and (ends_at is null or ends_at > now())
  `, [code]);
  return found[0] ?? null;
}

export async function cities(db: Db) {
  return rows(db, `
    select zc.city, zc.province, zc.transit_days, r.fee, r.free_over
    from shipping_zone_cities zc
    join shipping_rates r on r.zone_id = zc.zone_id
    join shipping_methods m on m.id = r.method_id and m.code = 'standard' and m.active
    order by zc.city
  `);
}

export async function reserve(db: Db, variantId: string, quantity: number, key: string, cartId: string) {
  const found = await rows<{ id: string }>(db, "select reserve_inventory($1, $2, $3, $4) as id", [variantId, quantity, key, cartId]);
  return found[0].id;
}

export async function release(db: Db, reservationId: string) {
  await rows(db, "select release_reservation($1)", [reservationId]);
}

export async function available(db: Db, variantId: string) {
  const found = await rows<{ available: number; sku: string }>(db, `
    select i.available, v.sku from inventory_levels i join variants v on v.id = i.variant_id where i.variant_id = $1
  `, [variantId]);
  return found[0] ?? null;
}

export async function reviewsForProduct(db: Db, productId: string) {
  return rows(db, `
    select r.id, r.rating, r.title, r.body, r.verified, r.created_at, p.full_name
    from reviews r join profiles p on p.id = r.customer_id
    where r.product_id = $1 and r.status = 'published'
    order by r.created_at desc limit 24
  `, [productId]);
}

export async function productIdBySlug(db: Db, slug: string) {
  const found = await rows<{ id: string }>(db, "select id from products where slug = $1 and status = 'active'", [slug]);
  return found[0]?.id ?? null;
}

export async function addReview(db: Db, productId: string, customerId: string, rating: number, title: string, body: string) {
  const found = await rows<{ id: string; status: string }>(db, `
    insert into reviews (product_id, customer_id, rating, title, body) values ($1, $2, $3, $4, $5)
    returning id, status
  `, [productId, customerId, rating, title, body]);
  return found[0];
}

export async function profile(db: Db, id: string) {
  const found = await rows(db, "select id, full_name, phone, avatar_url, status, role from profiles where id = $1", [id]);
  return found[0] ?? null;
}

export async function ensureProfile(db: Db, id: string, fullName: string) {
  const found = await rows<{ id: string }>(db, `
    insert into profiles (id, full_name) values ($1, $2)
    on conflict (id) do nothing
    returning id
  `, [id, fullName]);
  return found[0]?.id ?? null;
}

export async function fillProfileName(db: Db, id: string, fullName: string) {
  await rows(db, "update profiles set full_name = $2 where id = $1 and full_name = ''", [id, fullName]);
}

export async function updateProfile(db: Db, id: string, fullName: string, phone: string | null) {
  await rows(db, "update profiles set full_name = $2, phone = $3 where id = $1", [id, fullName, phone]);
}

export async function addresses(db: Db, customerId: string) {
  return rows(db, `
    select id, full_name, phone, line1, line2, city, province, postal_code, country, is_default_shipping, is_default_billing
    from addresses where customer_id = $1 order by created_at
  `, [customerId]);
}

export async function insertAddress(db: Db, customerId: string, input: Record<string, unknown>) {
  if (input.isDefaultShipping) await rows(db, "update addresses set is_default_shipping = false where customer_id = $1 and is_default_shipping", [customerId]);
  if (input.isDefaultBilling) await rows(db, "update addresses set is_default_billing = false where customer_id = $1 and is_default_billing", [customerId]);
  const found = await rows<{ id: string }>(db, `
    insert into addresses (customer_id, full_name, phone, line1, line2, city, province, postal_code, country, is_default_shipping, is_default_billing)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id
  `, [customerId, input.fullName, input.phone, input.line1, input.line2 ?? "", input.city, input.province ?? "", input.postalCode ?? "", input.country ?? "PK", input.isDefaultShipping ?? false, input.isDefaultBilling ?? false]);
  return found[0].id;
}

export async function deleteAddress(db: Db, customerId: string, addressId: string) {
  const found = await rows(db, "delete from addresses where id = $1 and customer_id = $2 returning id", [addressId, customerId]);
  return found.length > 0;
}

export async function subscribeNewsletter(db: Db, email: string, source = "footer") {
  const normalized = email.trim().toLowerCase();
  const found = await rows<{ id: string; email: string }>(db, `
    insert into newsletter_subscribers (email, source, unsubscribed_at)
    values ($1, $2, null)
    on conflict ((lower(email))) do update
      set unsubscribed_at = null,
          source = excluded.source,
          updated_at = now()
    returning id, email
  `, [normalized, source]);
  return found[0];
}
