begin;

insert into public.shop_settings (id, global_theme, appearance_config)
values ('prototype', 'blue', '{}'::jsonb)
on conflict (id) do nothing;

drop view if exists public.public_shop_settings;

create view public.public_shop_settings
with (security_barrier = true)
as
select id, global_theme, hero_media_type, hero_icon_style, hero_image_url, hero_product_id, appearance_config
from public.shop_settings
where id in ('global', 'prototype');

revoke all on public.public_shop_settings from public;
grant select on public.public_shop_settings to anon, authenticated;

commit;
