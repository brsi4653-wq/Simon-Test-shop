-- SHIPS ADDITIVE THEME SETUP
-- Run this entire file once. It preserves all existing garments and collections.

begin;

alter table public.shop_items drop constraint if exists shop_items_theme_check;
alter table public.shop_items alter column theme set default 'global';
alter table public.shop_items
  add constraint shop_items_theme_check
  check (theme in ('global', 'core', 'sunfade', 'green', 'orange', 'blue', 'red', 'yellow', 'mono'));

create table if not exists public.shop_settings (
  id text primary key,
  global_theme text not null default 'core'
    check (global_theme in ('core', 'sunfade', 'green', 'orange', 'blue', 'red', 'yellow', 'mono')),
  hero_media_type text not null default 'icon' check (hero_media_type in ('icon', 'image', 'product')),
  hero_icon_style text not null default 'orbit-shop' check (hero_icon_style in ('orbit-shop', 'orbit-ships', 'orbit-tag', 'plain-shop', 'plain-ships', 'rings-only')),
  hero_image_url text not null default '',
  hero_product_id uuid references public.shop_items(id) on delete set null,
  appearance_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.shop_settings (id, global_theme)
values ('global', 'core')
on conflict (id) do nothing;

alter table public.shop_settings enable row level security;

drop policy if exists "shop admin reads settings" on public.shop_settings;
create policy "shop admin reads settings"
on public.shop_settings for select to authenticated
using (public.is_portfolio_admin());

drop policy if exists "shop admin creates settings" on public.shop_settings;
create policy "shop admin creates settings"
on public.shop_settings for insert to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "shop admin updates settings" on public.shop_settings;
create policy "shop admin updates settings"
on public.shop_settings for update to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

revoke all on public.shop_settings from anon, authenticated;
grant select, insert, update on public.shop_settings to authenticated;

drop view if exists public.public_shop_settings;

create or replace view public.public_shop_settings
with (security_barrier = true)
as
select id, global_theme, hero_media_type, hero_icon_style, hero_image_url, hero_product_id, appearance_config
from public.shop_settings
where id = 'global';

revoke all on public.public_shop_settings from public;
grant select on public.public_shop_settings to anon, authenticated;

commit;

select id, global_theme, 'SHIPS theme setup succeeded' as result
from public.shop_settings
where id = 'global';
