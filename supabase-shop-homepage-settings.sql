begin;

alter table public.shop_settings
  add column if not exists hero_media_type text not null default 'icon'
    check (hero_media_type in ('icon', 'image', 'product'));

alter table public.shop_settings
  add column if not exists hero_icon_style text not null default 'orbit-shop'
    check (hero_icon_style in ('orbit-shop', 'orbit-ships', 'orbit-tag', 'plain-shop', 'plain-ships', 'rings-only'));

alter table public.shop_settings
  add column if not exists hero_image_url text not null default '';

alter table public.shop_settings
  add column if not exists hero_product_id uuid references public.shop_items(id) on delete set null;

alter table public.shop_settings
  add column if not exists appearance_config jsonb not null default '{}'::jsonb;

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
