-- Atomic stock and checkout. Prices and quantities are read inside the database.

create function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and status = 'active'
      and role in ('staff', 'manager', 'admin')
  )
$$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and status = 'active' and role = 'admin'
  )
$$;

-- JWT role is the caller even inside security-definer functions. current_user is not.
create function jwt_role() returns text
language sql stable set search_path = public as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$$;

create function is_privileged() returns boolean
language sql stable set search_path = public as $$
  select case
    when jwt_role() = 'service_role' then true
    when jwt_role() in ('anon', 'authenticated') then false
    else session_user in ('postgres', 'supabase_admin', 'service_role')
      or coalesce((select rolsuper or rolbypassrls from pg_roles where rolname = session_user), false)
  end
$$;

create function request_cart_token() returns uuid
language plpgsql stable set search_path = public as $$
declare
  raw text;
begin
  raw := nullif(current_setting('request.headers', true)::json ->> 'x-cart-token', '');
  if raw is null then
    return null;
  end if;
  return raw::uuid;
exception
  when others then
    return null;
end $$;

create function protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.role <> 'customer' and not (is_privileged() or is_admin()) then
      raise exception 'role assignment requires admin';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role or new.status is distinct from old.status then
    if not (is_privileged() or is_admin()) then
      raise exception 'role or status change requires admin';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_protect before insert or update on profiles
for each row execute function protect_profile();

create function reject_ledger_mutation() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;

create trigger inventory_tx_immutable before update or delete on inventory_transactions
for each row execute function reject_ledger_mutation();

create trigger order_items_immutable before update or delete on order_items
for each row execute function reject_ledger_mutation();

create trigger order_history_immutable before update or delete on order_status_history
for each row execute function reject_ledger_mutation();

create function audit_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  target := coalesce(new.id, old.id);
  insert into audit_log (actor_id, action, entity, entity_id, summary)
  values (auth.uid(), lower(tg_op), tg_table_name, target, lower(tg_op) || ' ' || tg_table_name);
  return coalesce(new, old);
end $$;

create trigger products_audit after update on products
for each row execute function audit_event();

create trigger orders_audit after update on orders
for each row execute function audit_event();

create trigger payments_audit after update on payments
for each row execute function audit_event();

create function bump_catalog_cache() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update cache_versions set version = version + 1, updated_at = now() where key = 'catalog';
  return null;
end $$;

create trigger products_cache after insert or update or delete on products
for each statement execute function bump_catalog_cache();

create trigger variants_cache after insert or update or delete on variants
for each statement execute function bump_catalog_cache();

create trigger categories_cache after insert or update or delete on categories
for each statement execute function bump_catalog_cache();

create trigger collections_cache after insert or update or delete on collections
for each statement execute function bump_catalog_cache();

create function cart_visible(p_customer uuid, p_token uuid) returns boolean
language sql stable set search_path = public as $$
  select is_privileged()
    or p_customer = auth.uid()
    or (p_customer is null and p_token is not null and p_token = request_cart_token())
$$;

create function reserve_inventory(
  p_variant_id uuid,
  p_qty integer,
  p_idempotency_key text,
  p_cart_id uuid,
  p_ttl interval default interval '15 minutes'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_on integer;
  v_res integer;
  v_customer uuid;
  v_token uuid;
begin
  if p_qty is null or p_qty < 1 or p_qty > 8 then
    raise exception 'invalid quantity';
  end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then
    raise exception 'idempotency key required';
  end if;

  select id into v_id from inventory_reservations where idempotency_key = p_idempotency_key;
  if v_id is not null then
    return v_id;
  end if;

  select customer_id, guest_token into v_customer, v_token from carts where id = p_cart_id;
  if not found or not cart_visible(v_customer, v_token) then
    raise exception 'cart not accessible';
  end if;

  select on_hand, reserved into v_on, v_res
  from inventory_levels where variant_id = p_variant_id for update;
  if not found then
    raise exception 'no inventory row';
  end if;
  if v_on - v_res < p_qty then
    raise exception 'insufficient_stock';
  end if;

  update inventory_levels
  set reserved = reserved + p_qty
  where variant_id = p_variant_id;

  insert into inventory_reservations (variant_id, quantity, status, cart_id, idempotency_key, expires_at)
  values (p_variant_id, p_qty, 'held', p_cart_id, p_idempotency_key, now() + p_ttl)
  returning id into v_id;

  insert into inventory_transactions (variant_id, tx_type, quantity, on_hand_after, reserved_after, reservation_id, actor_id)
  values (p_variant_id, 'reservation', p_qty, v_on, v_res + p_qty, v_id, auth.uid());

  return v_id;
exception
  when unique_violation then
    select id into v_id from inventory_reservations where idempotency_key = p_idempotency_key;
    if v_id is not null then
      return v_id;
    end if;
    raise;
end $$;

create function release_reservation(p_reservation_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_variant uuid;
  v_qty integer;
  v_status reservation_status;
  v_cart uuid;
  v_customer uuid;
  v_token uuid;
  v_on integer;
  v_res integer;
begin
  select variant_id into v_variant from inventory_reservations where id = p_reservation_id;
  if not found then
    return;
  end if;

  select on_hand, reserved into v_on, v_res
  from inventory_levels where variant_id = v_variant for update;

  select variant_id, quantity, status, cart_id into v_variant, v_qty, v_status, v_cart
  from inventory_reservations where id = p_reservation_id for update;
  if not found or v_status is distinct from 'held' then
    return;
  end if;

  select customer_id, guest_token into v_customer, v_token from carts where id = v_cart;
  if not (is_privileged() or is_staff() or cart_visible(v_customer, v_token)) then
    raise exception 'cart not accessible';
  end if;

  update inventory_levels
  set reserved = reserved - v_qty
  where variant_id = v_variant;

  update inventory_reservations set status = 'released' where id = p_reservation_id;

  insert into inventory_transactions (variant_id, tx_type, quantity, on_hand_after, reserved_after, reservation_id, actor_id)
  values (v_variant, 'reservation_release', v_qty, v_on, v_res - v_qty, p_reservation_id, auth.uid());
end $$;

create function release_cart_holds() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from inventory_reservations
    where cart_id = old.id and status = 'held'
    order by variant_id
  loop
    perform release_reservation(v_id);
  end loop;
  return old;
end $$;

create trigger carts_release_holds before delete on carts
for each row execute function release_cart_holds();

create function expire_reservations() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_variant uuid;
  v_id uuid;
  v_count integer := 0;
begin
  if not (is_privileged() or is_staff()) then
    raise exception 'not allowed';
  end if;

  for v_variant in
    select distinct variant_id from inventory_reservations
    where status = 'held' and expires_at <= now()
    order by variant_id
  loop
    perform 1 from inventory_levels where variant_id = v_variant for update;
    for v_id in
      select id from inventory_reservations
      where variant_id = v_variant and status = 'held' and expires_at <= now()
      order by id
      for update
    loop
      perform release_reservation(v_id);
      update inventory_reservations set status = 'expired' where id = v_id and status = 'released';
      v_count := v_count + 1;
    end loop;
  end loop;
  return v_count;
end $$;

create function adjust_inventory(
  p_variant_id uuid,
  p_type inventory_tx_type,
  p_delta integer,
  p_note text default ''
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_on integer;
  v_res integer;
  v_damaged integer;
  v_returned integer;
  v_sold integer;
begin
  if not (is_privileged() or is_staff()) then
    raise exception 'not allowed';
  end if;
  if p_type in ('sale', 'reservation', 'reservation_release') then
    raise exception 'use the checkout functions for %', p_type;
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'delta required';
  end if;

  select on_hand, reserved, damaged, returned, sold
  into v_on, v_res, v_damaged, v_returned, v_sold
  from inventory_levels where variant_id = p_variant_id for update;
  if not found then
    raise exception 'no inventory row';
  end if;

  v_on := v_on + p_delta;
  if p_type = 'damage' then
    if p_delta > 0 then
      raise exception 'damage delta must be negative';
    end if;
    v_damaged := v_damaged + abs(p_delta);
  elsif p_type = 'return' then
    if p_delta < 0 then
      raise exception 'return delta must be positive';
    end if;
    v_returned := v_returned + p_delta;
    v_sold := greatest(v_sold - p_delta, 0);
  end if;

  update inventory_levels
  set on_hand = v_on, damaged = v_damaged, returned = v_returned, sold = v_sold
  where variant_id = p_variant_id;

  insert into inventory_transactions (variant_id, tx_type, quantity, on_hand_after, reserved_after, actor_id, note)
  values (p_variant_id, p_type, abs(p_delta), v_on, v_res, auth.uid(), coalesce(p_note, ''));
end $$;

create function set_order_status(p_order_id uuid, p_status order_status, p_reason text default '') returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old order_status;
  v_ok boolean := false;
begin
  if not (is_privileged() or is_staff()) then
    raise exception 'not allowed';
  end if;

  select status into v_old from orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found';
  end if;
  if v_old = p_status then
    return;
  end if;

  v_ok := (v_old = 'created' and p_status in ('confirmed', 'cancelled'))
    or (v_old = 'confirmed' and p_status in ('processing', 'cancelled'))
    or (v_old = 'processing' and p_status in ('shipped', 'cancelled'))
    or (v_old = 'shipped' and p_status in ('delivered', 'returned'))
    or (v_old = 'delivered' and p_status = 'returned')
    or (v_old = 'returned' and p_status = 'refunded');
  if not v_ok then
    raise exception 'invalid status transition % -> %', v_old, p_status;
  end if;

  update orders
  set status = p_status,
      fulfillment_status = case
        when p_status = 'shipped' then 'partial'::fulfillment_status
        when p_status = 'delivered' then 'fulfilled'::fulfillment_status
        when p_status = 'returned' then 'returned'::fulfillment_status
        else fulfillment_status
      end
  where id = p_order_id;

  update shipments
  set status = case p_status
        when 'processing' then 'packed'::shipment_status
        when 'shipped' then 'shipped'::shipment_status
        when 'delivered' then 'delivered'::shipment_status
        else status
      end,
      shipped_at = case when p_status = 'shipped' then coalesce(shipped_at, now()) else shipped_at end
  where order_id = p_order_id;

  insert into order_status_history (order_id, old_status, new_status, actor_id, source, reason)
  values (p_order_id, v_old, p_status, auth.uid(), 'staff', coalesce(p_reason, ''));
end $$;

create function place_order(
  p_cart_id uuid,
  p_email text,
  p_shipping jsonb,
  p_method text,
  p_idempotency_key text,
  p_coupon text default null,
  p_card_last4 text default null,
  p_billing jsonb default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_order uuid;
  v_customer uuid;
  v_token uuid;
  v_city text;
  v_method payment_method;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_shipping integer := 0;
  v_coupon_type discount_type;
  v_coupon_amount integer;
  v_coupon_min integer;
  v_coupon_max integer;
  v_coupon_limit integer;
  v_coupon_each integer;
  v_line record;
  v_hold uuid;
  v_hold_qty integer;
  v_on integer;
  v_res integer;
  v_address jsonb;
  v_number text;
  v_provider text;
begin
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then
    raise exception 'idempotency key required';
  end if;
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'email required';
  end if;

  select id into v_order from orders where idempotency_key = p_idempotency_key;
  if v_order is not null then
    return v_order;
  end if;

  v_method := p_method::payment_method;
  if p_card_last4 is not null and p_card_last4 !~ '^[0-9]{4}$' then
    raise exception 'invalid card last4';
  end if;

  select customer_id, guest_token into v_customer, v_token
  from carts where id = p_cart_id for update;
  if not found or not cart_visible(v_customer, v_token) then
    raise exception 'cart not accessible';
  end if;

  perform 1 from cart_items where cart_id = p_cart_id order by variant_id for update;

  v_city := p_shipping ->> 'city';
  if coalesce(p_shipping ->> 'name', '') = ''
    or coalesce(p_shipping ->> 'phone', '') = ''
    or coalesce(p_shipping ->> 'address', '') = ''
    or v_city is null then
    raise exception 'incomplete shipping address';
  end if;

  select r.fee into v_shipping
  from shipping_zone_cities zc
  join shipping_rates r on r.zone_id = zc.zone_id
  join shipping_methods m on m.id = r.method_id and m.active and m.code = 'standard'
  where zc.city = v_city;
  if v_shipping is null then
    raise exception 'city is not deliverable';
  end if;

  for v_line in
    select ci.variant_id, ci.quantity
    from cart_items ci
    where ci.cart_id = p_cart_id
    order by ci.variant_id
  loop
    perform 1 from inventory_levels where variant_id = v_line.variant_id for update;
  end loop;

  for v_line in
    select ci.variant_id, ci.quantity, v.price, v.sku, v.metal, v.size, v.status as variant_status,
           p.id as product_id, p.name, p.image_url, p.status as product_status
    from cart_items ci
    join variants v on v.id = ci.variant_id
    join products p on p.id = v.product_id
    where ci.cart_id = p_cart_id
    order by ci.variant_id
  loop
    if v_line.variant_status <> 'active' or v_line.product_status <> 'active' then
      raise exception 'unavailable item %', v_line.sku;
    end if;

    select id, quantity into v_hold, v_hold_qty
    from inventory_reservations
    where cart_id = p_cart_id and variant_id = v_line.variant_id and status = 'held'
    for update;

    select on_hand, reserved into v_on, v_res
    from inventory_levels where variant_id = v_line.variant_id;

    if v_hold is not null then
      if v_hold_qty <> v_line.quantity then
        raise exception 'reservation quantity mismatch';
      end if;
      update inventory_levels
      set on_hand = on_hand - v_line.quantity,
          reserved = reserved - v_line.quantity,
          sold = sold + v_line.quantity
      where variant_id = v_line.variant_id
        and reserved >= v_line.quantity
        and on_hand >= v_line.quantity;
      if not found then
        raise exception 'insufficient_stock';
      end if;
      update inventory_reservations set status = 'committed' where id = v_hold;
    else
      update inventory_levels
      set on_hand = on_hand - v_line.quantity,
          sold = sold + v_line.quantity
      where variant_id = v_line.variant_id
        and on_hand - reserved >= v_line.quantity;
      if not found then
        raise exception 'insufficient_stock';
      end if;
    end if;

    v_subtotal := v_subtotal + v_line.price * v_line.quantity;
  end loop;

  if v_subtotal = 0 then
    raise exception 'cart is empty';
  end if;

  if p_coupon is not null then
    select discount_type, amount, min_subtotal, max_discount, usage_limit, per_customer_limit
    into v_coupon_type, v_coupon_amount, v_coupon_min, v_coupon_max, v_coupon_limit, v_coupon_each
    from coupons
    where code = upper(p_coupon) and active
      and starts_at <= now() and (ends_at is null or ends_at > now())
    for update;
    if not found then
      raise exception 'coupon invalid';
    end if;
    if v_subtotal < v_coupon_min then
      raise exception 'coupon minimum not met';
    end if;
    if v_coupon_limit is not null and (
      select count(*) from coupon_redemptions where code = upper(p_coupon)
    ) >= v_coupon_limit then
      raise exception 'coupon exhausted';
    end if;
    if v_customer is not null and (
      select count(*) from coupon_redemptions where code = upper(p_coupon) and customer_id = v_customer
    ) >= v_coupon_each then
      raise exception 'coupon already used';
    end if;
    if exists (select 1 from coupon_products where code = upper(p_coupon))
      and exists (
        select 1 from cart_items ci
        join variants v on v.id = ci.variant_id
        where ci.cart_id = p_cart_id
          and not exists (
            select 1 from coupon_products cp
            where cp.code = upper(p_coupon) and cp.product_id = v.product_id
          )
      ) then
      raise exception 'coupon does not apply';
    end if;
    if exists (select 1 from coupon_categories where code = upper(p_coupon))
      and exists (
        select 1 from cart_items ci
        join variants v on v.id = ci.variant_id
        where ci.cart_id = p_cart_id
          and not exists (
            select 1
            from product_categories pc
            join coupon_categories cc on cc.category_id = pc.category_id and cc.code = upper(p_coupon)
            where pc.product_id = v.product_id
          )
      ) then
      raise exception 'coupon does not apply';
    end if;
    if v_coupon_type = 'percent' then
      v_discount := v_subtotal * v_coupon_amount / 100;
    else
      v_discount := v_coupon_amount;
    end if;
    if v_coupon_max is not null then
      v_discount := least(v_discount, v_coupon_max);
    end if;
    v_discount := least(v_discount, v_subtotal);
  end if;

  if v_shipping > 0 and exists (
    select 1 from shipping_rates r
    join shipping_methods m on m.id = r.method_id and m.code = 'standard'
    join shipping_zone_cities zc on zc.zone_id = r.zone_id and zc.city = v_city
    where r.free_over is not null and v_subtotal >= r.free_over
  ) then
    v_shipping := 0;
  end if;

  v_address := jsonb_build_object(
    'name', p_shipping ->> 'name',
    'phone', p_shipping ->> 'phone',
    'email', p_email,
    'city', v_city,
    'address', p_shipping ->> 'address',
    'notes', coalesce(p_shipping ->> 'notes', '')
  );
  v_number := 'LJ-' || lpad(nextval('order_number_seq')::text, 5, '0');
  v_provider := case v_method
    when 'cod' then 'cash_on_delivery'
    when 'bank' then 'bank_transfer'
    else 'card'
  end;

  insert into orders (
    number, customer_id, email, currency, subtotal, discount, shipping_fee, tax, total,
    shipping_address, billing_address, idempotency_key
  ) values (
    v_number, v_customer, p_email, 'PKR', v_subtotal, v_discount, v_shipping, 0,
    v_subtotal - v_discount + v_shipping,
    v_address, coalesce(p_billing, v_address), p_idempotency_key
  ) returning id into v_order;

  insert into order_items (
    order_id, product_id, variant_id, sku, product_name, variant_label, image_url, unit_price, quantity, total
  )
  select v_order, p.id, v.id, v.sku, p.name, v.metal || ' / ' || v.size, p.image_url, v.price, ci.quantity, v.price * ci.quantity
  from cart_items ci
  join variants v on v.id = ci.variant_id
  join products p on p.id = v.product_id
  where ci.cart_id = p_cart_id;

  insert into inventory_transactions (variant_id, tx_type, quantity, on_hand_after, reserved_after, reservation_id, order_id, actor_id)
  select l.variant_id, 'sale', ci.quantity, l.on_hand, l.reserved, r.id, v_order, auth.uid()
  from cart_items ci
  join inventory_levels l on l.variant_id = ci.variant_id
  left join inventory_reservations r on r.cart_id = p_cart_id and r.variant_id = ci.variant_id and r.status = 'committed'
  where ci.cart_id = p_cart_id;

  update inventory_reservations set order_id = v_order
  where cart_id = p_cart_id and status = 'committed' and order_id is null;

  insert into order_status_history (order_id, old_status, new_status, actor_id, source)
  values (v_order, null, 'created', auth.uid(), 'checkout');

  insert into payments (order_id, provider, method, idempotency_key, amount, currency, card_last4)
  values (v_order, v_provider, v_method, p_idempotency_key, v_subtotal - v_discount + v_shipping, 'PKR', p_card_last4);

  insert into shipments (order_id, method_id, carrier, tracking, eta)
  select v_order, m.id, 'Luxe Courier', 'LX-' || lpad(currval('order_number_seq')::text, 5, '0'),
         now() + make_interval(days => zc.transit_days)
  from shipping_methods m
  join shipping_zone_cities zc on zc.city = v_city
  where m.code = 'standard'
  limit 1;

  if p_coupon is not null then
    insert into coupon_redemptions (code, customer_id, order_id, amount)
    values (upper(p_coupon), v_customer, v_order, v_discount);
  end if;

  delete from cart_items where cart_id = p_cart_id;
  return v_order;
exception
  when unique_violation then
    select id into v_order from orders where idempotency_key = p_idempotency_key;
    if v_order is not null then
      return v_order;
    end if;
    raise;
end $$;

create function cancel_order(p_order_id uuid, p_reason text default '') returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status order_status;
  v_payment payment_status;
  v_customer uuid;
  v_line record;
  v_on integer;
  v_res integer;
begin
  select status, payment_status, customer_id into v_status, v_payment, v_customer
  from orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found';
  end if;
  if not (is_privileged() or is_staff() or v_customer = auth.uid()) then
    raise exception 'not allowed';
  end if;
  if v_status not in ('created', 'confirmed') or v_payment not in ('pending', 'failed', 'cancelled') then
    raise exception 'order can no longer be cancelled';
  end if;

  for v_line in
    select variant_id, quantity from order_items where order_id = p_order_id order by variant_id
  loop
    select on_hand, reserved into v_on, v_res
    from inventory_levels where variant_id = v_line.variant_id for update;
    update inventory_levels
    set on_hand = on_hand + v_line.quantity,
        sold = greatest(sold - v_line.quantity, 0),
        returned = returned + v_line.quantity
    where variant_id = v_line.variant_id;
    insert into inventory_transactions (variant_id, tx_type, quantity, on_hand_after, reserved_after, order_id, actor_id, note)
    values (v_line.variant_id, 'return', v_line.quantity, v_on + v_line.quantity, v_res, p_order_id, auth.uid(), coalesce(p_reason, ''));
  end loop;

  update payments set status = 'cancelled' where order_id = p_order_id and status = 'pending';
  update orders set status = 'cancelled', payment_status = 'cancelled' where id = p_order_id;
  insert into order_status_history (order_id, old_status, new_status, actor_id, source, reason)
  values (p_order_id, v_status, 'cancelled', auth.uid(), 'checkout', coalesce(p_reason, ''));
end $$;

create function protect_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_privileged() or is_staff() then
    return new;
  end if;
  new.customer_id := auth.uid();
  new.verified := false;
  new.status := 'pending';
  return new;
end $$;

create trigger reviews_protect before insert or update on reviews
for each row execute function protect_review();

create function claim_guest_cart(p_token uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_guest uuid;
  v_own uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in required';
  end if;
  select id into v_guest from carts where guest_token = p_token for update;
  if not found then
    return null;
  end if;
  select id into v_own from carts where customer_id = auth.uid() for update;
  if v_own is null then
    update carts set customer_id = auth.uid(), guest_token = null where id = v_guest;
    return v_guest;
  end if;

  insert into cart_items (cart_id, variant_id, quantity)
  select v_own, variant_id, quantity from cart_items where cart_id = v_guest
  on conflict (cart_id, variant_id) do update
  set quantity = least(8, cart_items.quantity + excluded.quantity);

  update inventory_reservations set cart_id = v_own
  where cart_id = v_guest and status = 'held';
  delete from cart_items where cart_id = v_guest;
  delete from carts where id = v_guest;
  return v_own;
end $$;

do $user$
begin
  if to_regclass('auth.users') is not null then
    create or replace function handle_new_user() returns trigger
    language plpgsql security definer set search_path = public as $fn$
    begin
      insert into public.profiles (id, full_name)
      values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
      on conflict (id) do nothing;
      return new;
    end $fn$;
    execute 'drop trigger if exists on_auth_user_created on auth.users';
    execute 'create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user()';
  end if;
end
$user$;

revoke all on function jwt_role() from public;
revoke all on function is_staff() from public;
revoke all on function is_admin() from public;
revoke all on function is_privileged() from public;
revoke all on function request_cart_token() from public;
revoke all on function protect_profile() from public;
revoke all on function reject_ledger_mutation() from public;
revoke all on function audit_event() from public;
revoke all on function bump_catalog_cache() from public;
revoke all on function cart_visible(uuid, uuid) from public;
revoke all on function reserve_inventory(uuid, integer, text, uuid, interval) from public;
revoke all on function release_reservation(uuid) from public;
revoke all on function release_cart_holds() from public;
revoke all on function expire_reservations() from public;
revoke all on function adjust_inventory(uuid, inventory_tx_type, integer, text) from public;
revoke all on function set_order_status(uuid, order_status, text) from public;
revoke all on function place_order(uuid, text, jsonb, text, text, text, text, jsonb) from public;
revoke all on function cancel_order(uuid, text) from public;
revoke all on function claim_guest_cart(uuid) from public;
revoke all on function protect_review() from public;

grant execute on function reserve_inventory(uuid, integer, text, uuid, interval) to anon, authenticated, service_role;
grant execute on function release_reservation(uuid) to anon, authenticated, service_role;
grant execute on function place_order(uuid, text, jsonb, text, text, text, text, jsonb) to anon, authenticated, service_role;
grant execute on function cancel_order(uuid, text) to authenticated, service_role;
grant execute on function claim_guest_cart(uuid) to authenticated, service_role;
grant execute on function expire_reservations() to service_role;
grant execute on function adjust_inventory(uuid, inventory_tx_type, integer, text) to service_role;
grant execute on function set_order_status(uuid, order_status, text) to service_role;
