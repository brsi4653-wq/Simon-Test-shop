-- SHIPS COMPLETE SHOP RENEWAL
-- Run this entire file once. It deletes and rebuilds the SHIPS shop catalogue.
-- It does not affect the separate film portfolio tables.

begin;

create extension if not exists pgcrypto;

drop view if exists public.public_shop_items;
drop view if exists public.public_shop_collections;
drop view if exists public.public_shop_settings;
drop table if exists public.shop_item_collections;
drop table if exists public.shop_collections;
drop table if exists public.shop_items;
drop table if exists public.shop_settings;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'simon_j_brookes@icloud.com';
$function$;

create or replace function public.set_shop_item_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Untitled Garment',
  eyebrow text not null default 'Selected garment',
  summary text not null default '',
  description text not null default '',
  main_image_url text not null default '',
  gallery_urls jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  customization_options jsonb not null default '[]'::jsonb,
  production_note text not null default '',
  price_note text not null default 'Final price confirmed by email',
  item_mode text not null default 'regular'
    check (item_mode in ('regular', 'custom', 'hybrid')),
  request_subject text not null default '',
  request_intro text not null default '',
  shopify_product_url text not null default '',
  availability_status text not null default 'request-only'
    check (availability_status in ('available', 'coming-soon', 'sold-out', 'request-only')),
  theme text not null default 'global'
    check (theme in ('global', 'core', 'sunfade', 'green', 'orange', 'blue', 'red', 'yellow', 'mono')),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_item_collections (
  item_id uuid not null references public.shop_items(id) on delete cascade,
  collection_id uuid not null references public.shop_collections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, collection_id)
);

create table public.shop_settings (
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
values ('global', 'core');

create trigger shop_items_updated_at
before update on public.shop_items
for each row execute function public.set_shop_item_updated_at();

create trigger shop_collections_updated_at
before update on public.shop_collections
for each row execute function public.set_shop_item_updated_at();

create or replace function public.enforce_shop_collection_limit()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if (select count(*) from public.shop_collections) >= 6 then
    raise exception 'A maximum of six shop collections is allowed.';
  end if;
  return new;
end;
$function$;

create trigger shop_collection_limit
before insert on public.shop_collections
for each row execute function public.enforce_shop_collection_limit();

alter table public.shop_items enable row level security;
alter table public.shop_collections enable row level security;
alter table public.shop_item_collections enable row level security;
alter table public.shop_settings enable row level security;

create policy "shop admin reads items"
on public.shop_items for select to authenticated
using (public.is_portfolio_admin());

create policy "shop admin creates items"
on public.shop_items for insert to authenticated
with check (public.is_portfolio_admin());

create policy "shop admin updates items"
on public.shop_items for update to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "shop admin deletes items"
on public.shop_items for delete to authenticated
using (public.is_portfolio_admin());

create policy "shop admin reads collections"
on public.shop_collections for select to authenticated
using (public.is_portfolio_admin());

create policy "shop admin creates collections"
on public.shop_collections for insert to authenticated
with check (public.is_portfolio_admin());

create policy "shop admin updates collections"
on public.shop_collections for update to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "shop admin deletes collections"
on public.shop_collections for delete to authenticated
using (public.is_portfolio_admin());

create policy "shop admin reads item collections"
on public.shop_item_collections for select to authenticated
using (public.is_portfolio_admin());

create policy "shop admin creates item collections"
on public.shop_item_collections for insert to authenticated
with check (public.is_portfolio_admin());

create policy "shop admin deletes item collections"
on public.shop_item_collections for delete to authenticated
using (public.is_portfolio_admin());

create policy "shop admin reads settings"
on public.shop_settings for select to authenticated
using (public.is_portfolio_admin());

create policy "shop admin creates settings"
on public.shop_settings for insert to authenticated
with check (public.is_portfolio_admin());

create policy "shop admin updates settings"
on public.shop_settings for update to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

revoke all on public.shop_items from anon, authenticated;
revoke all on public.shop_collections from anon, authenticated;
revoke all on public.shop_item_collections from anon, authenticated;
revoke all on public.shop_settings from anon, authenticated;

grant select, insert, update, delete on public.shop_items to authenticated;
grant select, insert, update, delete on public.shop_collections to authenticated;
grant select, insert, delete on public.shop_item_collections to authenticated;
grant select, insert, update on public.shop_settings to authenticated;
grant execute on function public.is_portfolio_admin() to authenticated;

insert into public.shop_collections (name, slug, sort_order, is_visible)
values ('Pants', 'pants', 10, true);

insert into public.shop_collections (name, slug, sort_order, is_visible)
values ('T-Shirts', 't-shirts', 20, true);

insert into public.shop_collections (name, slug, sort_order, is_visible)
values ('Hoodies', 'hoodies', 30, true);

create or replace function public.seed_shop_garment(
  p_slug text,
  p_title text,
  p_eyebrow text,
  p_summary text,
  p_description text,
  p_sizes jsonb,
  p_colors jsonb,
  p_options jsonb,
  p_mode text,
  p_theme text
)
returns void
language sql
set search_path = public
as $function$
  insert into public.shop_items (
    slug, title, eyebrow, summary, description,
    main_image_url, gallery_urls, sizes, colors, customization_options,
    production_note, price_note, item_mode, request_subject, request_intro,
    theme, is_published, is_featured
  )
  values (
    p_slug, p_title, p_eyebrow, p_summary, p_description,
    '', '[]'::jsonb, p_sizes, p_colors, p_options,
    'Produced individually based on garment availability. Final availability, pricing, and delivery are confirmed before payment.',
    'Final price confirmed by email',
    p_mode, '', '', p_theme, true, false
  );
$function$;

select public.seed_shop_garment(
  'sunfade-oversized-hoodie',
  'Sunfade Oversized Hoodie',
  'Hoodie',
  'A softly faded oversized hoodie with a relaxed shape and tonal finish.',
  'A selected SHIPS hoodie built around an oversized fit and softly faded colour treatment.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Sunfade Pink","Sunfade Steel"]'::jsonb,
  '["Oversized fit","Soft faded finish","Heavyweight feel","Seasonal release"]'::jsonb,
  'regular',
  'red'
);

select public.seed_shop_garment(
  'contrast-collar-polo',
  'Contrast Collar Polo',
  'Polo',
  'A polished contrast-collar polo with a clean shape and restrained colour pairing.',
  'A selected SHIPS polo defined by its contrast collar, button placket, and structured casual fit.',
  '["S","M","L","XL","2XL","3XL"]'::jsonb,
  '["Wine / Cream"]'::jsonb,
  '["Contrast collar","Button placket","Structured casual fit","Selected garment"]'::jsonb,
  'regular',
  'red'
);

select public.seed_shop_garment(
  'layered-oversized-tee',
  'Layered Oversized Tee',
  'T-Shirt',
  'An oversized layered tee with a strong silhouette and contrasting sleeve construction.',
  'A selected SHIPS t-shirt built around an oversized body and layered long-sleeve appearance.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Black / Layered White Sleeve"]'::jsonb,
  '["Oversized fit","Layered construction","Contrasting sleeve","Selected garment"]'::jsonb,
  'regular',
  'mono'
);

select public.seed_shop_garment(
  'contrast-track-jacket',
  'Contrast Track Jacket',
  'Track Jacket',
  'A contrast track jacket with a clean athletic shape and coordinated panel details.',
  'A selected SHIPS outerwear piece with a lightweight track silhouette and contrast finish.',
  '["XS","S","M","L","XL","2XL"]'::jsonb,
  '["Wine / Cream"]'::jsonb,
  '["Track silhouette","Contrast panels","Lightweight outer layer","Selected garment"]'::jsonb,
  'regular',
  'red'
);

select public.seed_shop_garment(
  'paint-detailed-heavyweight-tee',
  'Paint-Detailed Heavyweight Tee',
  'T-Shirt',
  'A heavyweight tee finished with restrained paint-inspired detailing.',
  'A selected SHIPS t-shirt balancing a substantial fit with subtle paint-inspired accents.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Apricot","Soft Rose","Powder Blue"]'::jsonb,
  '["Heavyweight feel","Relaxed fit","Paint-inspired details","Selected garment"]'::jsonb,
  'regular',
  'orange'
);

select public.seed_shop_garment(
  'washed-oversized-tee',
  'Washed Oversized Tee',
  'T-Shirt',
  'A heavyweight washed oversized tee with a relaxed shape and worn-in finish.',
  'A selected SHIPS staple defined by an oversized fit and washed colour treatment.',
  '["S","M","L","XL","2XL","3XL"]'::jsonb,
  '["Washed Black","Dusty Blue","Deep Indigo"]'::jsonb,
  '["Oversized fit","Heavyweight feel","Washed finish","Selected garment"]'::jsonb,
  'regular',
  'mono'
);

select public.seed_shop_garment(
  'distressed-layered-long-sleeve',
  'Distressed Layered Long Sleeve',
  'Long Sleeve',
  'A distressed layered long sleeve with an oversized shape and worn finish.',
  'A selected SHIPS long sleeve built around layered construction and a distressed surface treatment.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Washed Black"]'::jsonb,
  '["Layered construction","Distressed finish","Oversized fit","Selected garment"]'::jsonb,
  'regular',
  'mono'
);

select public.seed_shop_garment(
  'cloud-fade-tee',
  'Cloud Fade Tee',
  'T-Shirt',
  'A heavyweight cloud-fade tee with a soft tonal finish.',
  'A selected SHIPS t-shirt built around a relaxed shape and cloud-fade colour treatment.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Sky Fade"]'::jsonb,
  '["Heavyweight feel","Relaxed fit","Cloud-fade finish","Selected garment"]'::jsonb,
  'regular',
  'blue'
);

select public.seed_shop_garment(
  'vintage-black-denim',
  'Vintage Black Denim',
  'Pants',
  'Vintage black denim with a clean silhouette and worn finish.',
  'A selected SHIPS denim piece with a vintage black wash and straightforward everyday shape.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Vintage Black"]'::jsonb,
  '["Vintage black wash","Denim construction","Everyday fit","Selected garment"]'::jsonb,
  'regular',
  'mono'
);

select public.seed_shop_garment(
  'washed-denim-zip-tee',
  'Washed Denim Zip Tee',
  'T-Shirt',
  'A washed denim zip tee with a structured shape and distinctive front closure.',
  'A selected SHIPS t-shirt combining a washed denim finish with a clean zip construction.',
  '["S","M","L","XL"]'::jsonb,
  '["Vintage Washed Black"]'::jsonb,
  '["Washed denim finish","Zip construction","Structured fit","Selected garment"]'::jsonb,
  'regular',
  'mono'
);

select public.seed_shop_garment(
  'dirty-wash-zip-hoodie',
  'Dirty Wash Zip Hoodie',
  'Hoodie',
  'A heavyweight dirty-wash zip hoodie with a relaxed fit and worn tonal finish.',
  'A selected SHIPS hoodie combining substantial fleece, zip construction, and a dirty-wash texture.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Dirty Wash Grey"]'::jsonb,
  '["Heavyweight fleece","Zip construction","Dirty-wash finish","Relaxed fit"]'::jsonb,
  'regular',
  'blue'
);

select public.seed_shop_garment(
  'dirty-wash-sweatpants',
  'Dirty Wash Sweatpants',
  'Pants',
  'Heavyweight dirty-wash sweatpants with a relaxed straight-leg shape.',
  'A selected SHIPS fleece bottom combining a substantial feel with a worn dirty-wash finish.',
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Dirty Wash Grey"]'::jsonb,
  '["Heavyweight fleece","Relaxed straight leg","Dirty-wash finish","Selected garment"]'::jsonb,
  'regular',
  'blue'
);

drop function public.seed_shop_garment(text, text, text, text, text, jsonb, jsonb, jsonb, text, text);

insert into public.shop_item_collections (item_id, collection_id)
select item.id, collection.id
from public.shop_items item
join public.shop_collections collection
  on collection.slug = 'hoodies'
 and item.slug in ('sunfade-oversized-hoodie', 'dirty-wash-zip-hoodie');

insert into public.shop_item_collections (item_id, collection_id)
select item.id, collection.id
from public.shop_items item
join public.shop_collections collection
  on collection.slug = 'pants'
 and item.slug in ('vintage-black-denim', 'dirty-wash-sweatpants');

insert into public.shop_item_collections (item_id, collection_id)
select item.id, collection.id
from public.shop_items item
join public.shop_collections collection
  on collection.slug = 't-shirts'
 and item.slug in (
   'contrast-collar-polo',
   'layered-oversized-tee',
   'paint-detailed-heavyweight-tee',
   'washed-oversized-tee',
   'distressed-layered-long-sleeve',
   'cloud-fade-tee',
   'washed-denim-zip-tee'
 );

create or replace view public.public_shop_collections
with (security_barrier = true)
as
select id, name, slug, sort_order
from public.shop_collections
where is_visible = true
order by sort_order, name
limit 6;

create or replace view public.public_shop_items
with (security_barrier = true)
as
select
  item.id,
  item.slug,
  item.title,
  item.eyebrow,
  item.summary,
  item.description,
  item.main_image_url,
  item.gallery_urls,
  item.sizes,
  item.colors,
  item.customization_options,
  item.production_note,
  item.price_note,
  item.item_mode,
  item.request_subject,
  item.request_intro,
  item.theme,
  item.is_featured,
  item.created_at,
  coalesce((
    select jsonb_agg(collection.slug order by collection.sort_order, collection.name)
    from public.shop_item_collections membership
    join public.shop_collections collection
      on collection.id = membership.collection_id
    where membership.item_id = item.id
      and collection.is_visible = true
  ), '[]'::jsonb) as collection_slugs,
  item.shopify_product_url,
  item.availability_status
from public.shop_items item
where item.is_published = true;

create or replace view public.public_shop_settings
with (security_barrier = true)
as
select id, global_theme, hero_media_type, hero_icon_style, hero_image_url, hero_product_id, appearance_config
from public.shop_settings
where id = 'global';

revoke all on public.public_shop_items from public;
revoke all on public.public_shop_collections from public;
revoke all on public.public_shop_settings from public;
grant select on public.public_shop_items to anon, authenticated;
grant select on public.public_shop_collections to anon, authenticated;
grant select on public.public_shop_settings to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-media',
  'shop-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop admin uploads media" on storage.objects;
create policy "shop admin uploads media"
on storage.objects for insert to authenticated
with check (bucket_id = 'shop-media' and public.is_portfolio_admin());

drop policy if exists "shop admin updates media" on storage.objects;
create policy "shop admin updates media"
on storage.objects for update to authenticated
using (bucket_id = 'shop-media' and public.is_portfolio_admin())
with check (bucket_id = 'shop-media' and public.is_portfolio_admin());

drop policy if exists "shop admin deletes media" on storage.objects;
create policy "shop admin deletes media"
on storage.objects for delete to authenticated
using (bucket_id = 'shop-media' and public.is_portfolio_admin());

commit;

select
  (select count(*) from public.shop_items) as garment_count,
  (select count(*) from public.shop_collections) as collection_count,
  'SHIPS complete renewal succeeded' as result;
