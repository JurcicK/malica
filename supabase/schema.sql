create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  full_name text,
  role text not null check (role in ('admin', 'employee')),
  department text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_offers (
  id uuid primary key default gen_random_uuid(),
  week_label jsonb not null,
  source_label jsonb not null,
  cutoff_hour integer not null default 10,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.weekly_offers(id) on delete cascade,
  service_date date,
  category text not null,
  title jsonb not null,
  description jsonb,
  allergens text,
  is_always_available boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  user_id uuid not null references public.users(id) on delete cascade,
  meal_item_id uuid not null references public.meal_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (service_date, user_id)
);

create index if not exists idx_meal_items_offer_id on public.meal_items(offer_id);
create index if not exists idx_meal_items_service_date on public.meal_items(service_date);
create index if not exists idx_orders_service_date on public.orders(service_date);
create index if not exists idx_orders_user_id on public.orders(user_id);
