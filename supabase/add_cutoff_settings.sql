alter table public.weekly_offers
add column if not exists cutoff_minute integer not null default 0;

alter table public.weekly_offers
add column if not exists cutoff_overrides jsonb not null default '{}'::jsonb;

alter table public.weekly_offers
add column if not exists edit_versions jsonb not null default '{}'::jsonb;

alter table public.weekly_offers
drop constraint if exists weekly_offers_cutoff_minute_check;

alter table public.weekly_offers
add constraint weekly_offers_cutoff_minute_check
check (cutoff_minute >= 0 and cutoff_minute <= 59);

update public.weekly_offers
set
  cutoff_minute = coalesce(cutoff_minute, 0),
  cutoff_overrides = coalesce(cutoff_overrides, '{}'::jsonb),
  edit_versions = coalesce(edit_versions, '{}'::jsonb);
