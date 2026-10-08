-- Row security. Hot policies compare auth.uid() as a scalar, not a per-row subquery.

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function is_staff() to anon, authenticated, service_role;
grant execute on function is_admin() to anon, authenticated, service_role;
grant execute on function request_cart_token() to anon, authenticated, service_role;

revoke all on all tables in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

grant select on brands, categories, collections, product_categories, collection_products,
  product_media, product_details, product_tags, shipping_zones, shipping_zone_cities,
  shipping_methods, shipping_rates
to anon, authenticated;

grant select on products, coupons to anon, authenticated;
grant select (
  id, product_id, sku, barcode, metal, size, color, price, compare_at_price, currency,
  weight_g, dimensions, status, created_at, updated_at
) on variants to anon, authenticated;

grant select (variant_id, available) on inventory_levels to anon, authenticated;

grant select, insert, update, delete on carts, cart_items to anon, authenticated;
grant select on inventory_reservations to anon, authenticated;

grant select, insert, update on profiles to authenticated;
grant select, insert, update, delete on addresses, wishlists, wishlist_items to authenticated;
grant select on orders, order_items, order_status_history, payments, shipments, coupon_redemptions to authenticated;
grant select, insert, update on reviews to authenticated;

alter table profiles enable row level security;
alter table addresses enable row level security;
alter table brands enable row level security;
alter table categories enable row level security;
alter table collections enable row level security;
alter table products enable row level security;
alter table product_categories enable row level security;
alter table collection_products enable row level security;
alter table product_media enable row level security;
alter table product_details enable row level security;
alter table product_tags enable row level security;
alter table variants enable row level security;
alter table inventory_levels enable row level security;
alter table inventory_reservations enable row level security;
alter table inventory_transactions enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table wishlists enable row level security;
alter table wishlist_items enable row level security;
alter table coupons enable row level security;
alter table coupon_products enable row level security;
alter table coupon_categories enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table payments enable row level security;
alter table coupon_redemptions enable row level security;
alter table shipping_zones enable row level security;
alter table shipping_zone_cities enable row level security;
alter table shipping_methods enable row level security;
alter table shipping_rates enable row level security;
alter table shipments enable row level security;
alter table reviews enable row level security;
alter table audit_log enable row level security;
alter table cache_versions enable row level security;

alter table profiles force row level security;
alter table addresses force row level security;
alter table orders force row level security;
alter table order_items force row level security;
alter table payments force row level security;
alter table carts force row level security;
alter table cart_items force row level security;
alter table wishlists force row level security;
alter table wishlist_items force row level security;
alter table reviews force row level security;
alter table inventory_levels force row level security;
alter table inventory_transactions force row level security;
alter table inventory_reservations force row level security;
alter table audit_log force row level security;

create policy profiles_select on profiles for select
  using (id = (select auth.uid()) or (select is_staff()));
create policy profiles_insert on profiles for insert
  with check (id = (select auth.uid()) and role = 'customer' and status = 'active');
create policy profiles_update on profiles for update
  using (id = (select auth.uid()) or (select is_admin()))
  with check (id = (select auth.uid()) or (select is_admin()));

create policy addresses_own on addresses for all
  using (customer_id = (select auth.uid()) or (select is_staff()))
  with check (customer_id = (select auth.uid()));

create policy catalog_brand on brands for select using (true);
create policy catalog_category on categories for select using (true);
create policy catalog_collection on collections for select using (true);
create policy catalog_product_category on product_categories for select using (true);
create policy catalog_collection_product on collection_products for select using (true);
create policy catalog_media on product_media for select using (true);
create policy catalog_details on product_details for select using (true);
create policy catalog_tags on product_tags for select using (true);
create policy catalog_shipping_zone on shipping_zones for select using (true);
create policy catalog_shipping_city on shipping_zone_cities for select using (true);
create policy catalog_shipping_method on shipping_methods for select using (true);
create policy catalog_shipping_rate on shipping_rates for select using (true);

create policy products_read on products for select
  using (status = 'active' or (select is_staff()));
create policy variants_read on variants for select
  using (status = 'active' or (select is_staff()));
create policy coupons_read on coupons for select
  using (active or (select is_staff()));
create policy inventory_read on inventory_levels for select using (true);

create policy reservations_read on inventory_reservations for select
  using (
    (select is_staff())
    or exists (
      select 1 from carts c
      where c.id = cart_id and (
        c.customer_id = (select auth.uid())
        or (c.customer_id is null and c.guest_token = (select request_cart_token()))
      )
    )
  );

create policy ledger_staff on inventory_transactions for select
  using ((select is_staff()));

create policy carts_all on carts for all
  using (
    customer_id = (select auth.uid())
    or (customer_id is null and guest_token = (select request_cart_token()))
    or (select is_staff())
  )
  with check (
    (customer_id = (select auth.uid()) and guest_token is null)
    or (
      customer_id is null
      and guest_token = (select request_cart_token())
      and (select auth.uid()) is null
    )
  );

create policy cart_items_all on cart_items for all
  using (
    exists (
      select 1 from carts c
      where c.id = cart_id and (
        c.customer_id = (select auth.uid())
        or (c.customer_id is null and c.guest_token = (select request_cart_token()))
        or (select is_staff())
      )
    )
  )
  with check (
    exists (
      select 1 from carts c
      where c.id = cart_id and (
        c.customer_id = (select auth.uid())
        or (c.customer_id is null and c.guest_token = (select request_cart_token()))
      )
    )
  );

create policy wishlists_own on wishlists for all
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

create policy wishlist_items_own on wishlist_items for all
  using (
    exists (select 1 from wishlists w where w.id = wishlist_id and w.customer_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from wishlists w where w.id = wishlist_id and w.customer_id = (select auth.uid()))
  );

create policy orders_select on orders for select
  using (customer_id = (select auth.uid()) or (select is_staff()));

create policy order_items_select on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = (select auth.uid()) or (select is_staff()))
    )
  );

create policy order_history_select on order_status_history for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = (select auth.uid()) or (select is_staff()))
    )
  );

create policy payments_select on payments for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = (select auth.uid()) or (select is_staff()))
    )
  );

create policy redemptions_select on coupon_redemptions for select
  using (customer_id = (select auth.uid()) or (select is_staff()));

create policy shipments_select on shipments for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.customer_id = (select auth.uid()) or (select is_staff()))
    )
  );

create policy reviews_select on reviews for select
  using (status = 'published' or customer_id = (select auth.uid()) or (select is_staff()));
create policy reviews_insert on reviews for insert
  with check (customer_id = (select auth.uid()));
create policy reviews_update on reviews for update
  using (customer_id = (select auth.uid()) and status = 'pending')
  with check (customer_id = (select auth.uid()));

create policy audit_staff on audit_log for select
  using ((select is_staff()));

-- cache_versions, coupon_products, and coupon_categories have no client policies.
-- Checkout reads them inside security-definer functions.
