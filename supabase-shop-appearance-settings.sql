begin;

alter table public.shop_settings
  add column if not exists appearance_config jsonb not null default '{}'::jsonb;

drop view if exists public.public_shop_settings;

create view public.public_shop_settings
with (security_barrier = true)
as
select id, global_theme, hero_media_type, hero_icon_style, hero_image_url, hero_product_id, appearance_config
from public.shop_settings
where id = 'global';

revoke all on public.public_shop_settings from public;
grant select on public.public_shop_settings to anon, authenticated;

commit;

