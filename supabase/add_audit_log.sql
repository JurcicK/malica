create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  row_id text,
  old_data jsonb,
  new_data jsonb,
  changed_by text not null default current_user,
  changed_at timestamptz not null default now()
);

create table if not exists public.app_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.users(id) on delete set null,
  actor_username text,
  actor_role text,
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_changed_at
on public.audit_log(changed_at desc);

create index if not exists idx_audit_log_table_name
on public.audit_log(table_name);

create index if not exists idx_audit_log_row_id
on public.audit_log(row_id);

create index if not exists idx_app_audit_log_created_at
on public.app_audit_log(created_at desc);

create index if not exists idx_app_audit_log_actor_user_id
on public.app_audit_log(actor_user_id);

create index if not exists idx_app_audit_log_action
on public.app_audit_log(action);

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_row_id text;
begin
  changed_row_id := coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id'));

  insert into public.audit_log (
    table_name,
    operation,
    row_id,
    old_data,
    new_data,
    changed_by
  )
  values (
    tg_table_name,
    tg_op,
    changed_row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    current_user
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_meal_items on public.meal_items;
create trigger audit_meal_items
after insert or update or delete on public.meal_items
for each row execute function public.write_audit_log();

drop trigger if exists audit_orders on public.orders;
create trigger audit_orders
after insert or update or delete on public.orders
for each row execute function public.write_audit_log();

drop trigger if exists audit_weekly_offers on public.weekly_offers;
create trigger audit_weekly_offers
after insert or update or delete on public.weekly_offers
for each row execute function public.write_audit_log();

create or replace function public.prevent_ordered_meal_item_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.orders
    where meal_item_id = old.id
    limit 1
  ) then
    raise exception 'Meal item % cannot be deleted because it already has orders.', old.id
      using errcode = '23503';
  end if;

  return old;
end;
$$;

drop trigger if exists prevent_ordered_meal_item_delete on public.meal_items;
create trigger prevent_ordered_meal_item_delete
before delete on public.meal_items
for each row execute function public.prevent_ordered_meal_item_delete();
