alter table public.weekly_offers
add column if not exists edit_versions jsonb not null default '{}'::jsonb;

update public.weekly_offers
set edit_versions = coalesce(edit_versions, '{}'::jsonb);
