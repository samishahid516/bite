-- Zaiqa Bites / bite: Postgres schema for Supabase
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> Run).
-- Replaces the MongoDB/Mongoose data model with relational tables.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- USERS ----------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  password text not null,
  role text not null default 'CUSTOMER' check (role in ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN')),
  profile_image text,
  is_active boolean not null default true,
  refresh_token_version integer not null default 0,
  reset_password_token_hash text,
  reset_password_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_users_role on users(role);
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label text not null default 'Home' check (label in ('Home', 'Office', 'Other')),
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  area text not null,
  landmark text,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_addresses_user on addresses(user_id);
create trigger trg_addresses_updated_at before update on addresses
  for each row execute function set_updated_at();

-- CATEGORIES -------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  image text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_sort on categories(sort_order);
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

-- BRANCHES ---------------------------------------------------------------
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  area text not null,
  address text not null,
  phone text not null,
  latitude double precision not null,
  longitude double precision not null,
  opening_time text not null default '11:00',
  closing_time text not null default '23:59',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_branches_city on branches(city);
create trigger trg_branches_updated_at before update on branches
  for each row execute function set_updated_at();

create table delivery_areas (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  delivery_fee numeric not null check (delivery_fee >= 0),
  minimum_order numeric not null default 0 check (minimum_order >= 0),
  estimated_delivery_time text not null default '30-45 mins',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, name)
);
create trigger trg_delivery_areas_updated_at before update on delivery_areas
  for each row execute function set_updated_at();

-- INVENTORY ----------------------------------------------------------------
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null default 'pcs' check (unit in ('pcs', 'kg', 'g', 'l', 'ml', 'pack')),
  quantity_in_stock numeric not null default 0 check (quantity_in_stock >= 0),
  low_stock_threshold numeric not null default 10 check (low_stock_threshold >= 0),
  total_used numeric not null default 0 check (total_used >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_inventory_items_updated_at before update on inventory_items
  for each row execute function set_updated_at();

-- PRODUCTS -------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  category_id uuid not null references categories(id),
  images text[] not null default '{}',
  base_price numeric not null check (base_price >= 0),
  discount_price numeric check (discount_price >= 0),
  sizes jsonb not null default '[]',      -- [{ name, price }]
  crusts jsonb not null default '[]',     -- [{ name, price }]
  toppings jsonb not null default '[]',   -- [{ name, price }]
  extras jsonb not null default '[]',     -- [{ name, price }]
  ingredients text[] not null default '{}',
  recipe jsonb not null default '[]',     -- [{ itemId, quantity }] loose ref to inventory_items.id
  rating numeric not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on products(category_id);
create index idx_products_featured_popular on products(is_featured, is_popular);
create index idx_products_name_trgm on products using gin (to_tsvector('english', name || ' ' || coalesce(description, '')));
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

-- product_id's foreign key is added after the products table is created below.
create table user_favorites (
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table user_favorites
  add constraint fk_user_favorites_product foreign key (product_id) references products(id) on delete cascade;

-- DEALS ------------------------------------------------------------------
create table deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  image text,
  products jsonb not null default '[]', -- [{ product, quantity, size }]
  original_price numeric not null check (original_price >= 0),
  discount_price numeric not null check (discount_price >= 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  branch_id uuid references branches(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_deals_active_dates on deals(is_active, start_date, end_date);
create trigger trg_deals_updated_at before update on deals
  for each row execute function set_updated_at();

-- COUPONS ------------------------------------------------------------------
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text default '',
  discount_type text not null check (discount_type in ('PERCENTAGE', 'FIXED')),
  discount_value numeric not null check (discount_value >= 0),
  max_discount numeric,
  min_order numeric not null default 0,
  expiry_date timestamptz not null,
  usage_limit integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_coupons_updated_at before update on coupons
  for each row execute function set_updated_at();

-- ORDERS ---------------------------------------------------------------------
-- Order line items and the delivery address snapshot are stored as jsonb,
-- matching the original Mongoose embedded-subdocument design (a denormalized
-- snapshot of product/deal name & price at the time of order, not a live ref).
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references users(id),
  branch_id uuid not null references branches(id),
  items jsonb not null,              -- [{ itemType, product, deal, name, image, size, crust, toppings, extras, specialInstructions, quantity, unitPrice, totalPrice }]
  delivery_address jsonb not null,   -- { name, phone, address, city, area, landmark, latitude, longitude, instructions }
  delivery_area_id uuid not null references delivery_areas(id),
  subtotal numeric not null check (subtotal >= 0),
  coupon_code text,
  coupon_discount numeric not null default 0,
  delivery_fee numeric not null check (delivery_fee >= 0),
  tax numeric not null check (tax >= 0),
  total numeric not null check (total >= 0),
  payment_method text not null default 'COD' check (payment_method in ('COD', 'ONLINE')),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  order_status text not null default 'PENDING' check (order_status in ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
  special_instructions text default '',
  status_history jsonb not null default '[]', -- [{ status, changedBy, note, timestamp }]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user_created on orders(user_id, created_at desc);
create index idx_orders_status on orders(order_status);
create index idx_orders_branch on orders(branch_id);
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- PAYMENTS ---------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  method text not null check (method in ('COD', 'ONLINE')),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  amount numeric not null,
  provider text,
  transaction_ref text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- REVIEWS ------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  product_id uuid not null references products(id),
  order_id uuid not null references orders(id),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text default '',
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, order_id)
);
create index idx_reviews_product_approved on reviews(product_id, is_approved);
create trigger trg_reviews_updated_at before update on reviews
  for each row execute function set_updated_at();

-- BANNERS ------------------------------------------------------------------
create table banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  image text not null,
  button_text text default 'Order Now',
  button_url text default '/menu',
  start_date timestamptz default now(),
  end_date timestamptz,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_banners_updated_at before update on banners
  for each row execute function set_updated_at();

-- NOTIFICATIONS --------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  audience text not null check (audience in ('CUSTOMER', 'ADMIN')),
  title text not null,
  message text not null,
  type text not null default 'GENERAL' check (type in ('ORDER_PLACED', 'ORDER_STATUS', 'NEW_ORDER', 'GENERAL')),
  related_order_id uuid references orders(id),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notifications_user_read on notifications(user_id, is_read);
create index idx_notifications_audience_read on notifications(audience, is_read);
create trigger trg_notifications_updated_at before update on notifications
  for each row execute function set_updated_at();
