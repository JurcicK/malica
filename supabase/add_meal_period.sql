alter table public.meal_items
add column if not exists meal_period text not null default 'morning'
check (meal_period in ('morning', 'afternoon'));

alter table public.orders
add column if not exists meal_period text not null default 'morning'
check (meal_period in ('morning', 'afternoon'));

alter table public.orders
drop constraint if exists orders_service_date_user_id_key;

drop index if exists public.idx_orders_service_date_user_id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_service_date_user_id_meal_period_key'
  ) then
    alter table public.orders
    add constraint orders_service_date_user_id_meal_period_key
    unique (service_date, user_id, meal_period);
  end if;
end $$;

create index if not exists idx_meal_items_meal_period on public.meal_items(meal_period);
create index if not exists idx_orders_meal_period on public.orders(meal_period);
