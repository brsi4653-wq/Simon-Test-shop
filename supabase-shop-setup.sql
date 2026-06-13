create extension if not exists pgcrypto;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as 'select lower(coalesce(auth.jwt() ->> ''email'', '''')) = ''simon_j_brookes@icloud.com''';

create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Untitled Item',
  eyebrow text not null default 'Made to request',
  summary text not null default '',
  description text not null default '',
  main_image_url text not null default '',
  gallery_urls jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  customization_options jsonb not null default '[]'::jsonb,
  production_note text not null default '',
  price_note text not null default 'Final quote confirmed by email',
  item_mode text not null default 'regular' check (item_mode in ('regular', 'custom', 'hybrid')),
  request_subject text not null default '',
  request_intro text not null default '',
  shopify_product_url text not null default '',
  availability_status text not null default 'request-only'
    check (availability_status in ('available', 'coming-soon', 'sold-out', 'request-only')),
  theme text not null default 'global' check (theme in ('global', 'core', 'sunfade', 'green', 'orange', 'blue', 'red', 'yellow', 'mono')),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

drop trigger if exists shop_items_updated_at on public.shop_items;
create trigger shop_items_updated_at
before update on public.shop_items
for each row execute function public.set_shop_item_updated_at();

alter table public.shop_items enable row level security;

create table if not exists public.shop_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_item_collections (
  item_id uuid not null references public.shop_items(id) on delete cascade,
  collection_id uuid not null references public.shop_collections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, collection_id)
);

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

drop trigger if exists shop_collection_limit on public.shop_collections;
create trigger shop_collection_limit
before insert on public.shop_collections
for each row execute function public.enforce_shop_collection_limit();

drop trigger if exists shop_collections_updated_at on public.shop_collections;
create trigger shop_collections_updated_at
before update on public.shop_collections
for each row execute function public.set_shop_item_updated_at();

alter table public.shop_collections enable row level security;
alter table public.shop_item_collections enable row level security;
alter table public.shop_settings enable row level security;

drop policy if exists "shop admin reads items" on public.shop_items;
create policy "shop admin reads items" on public.shop_items for select to authenticated
using (public.is_portfolio_admin());

drop policy if exists "shop admin creates items" on public.shop_items;
create policy "shop admin creates items" on public.shop_items for insert to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "shop admin updates items" on public.shop_items;
create policy "shop admin updates items" on public.shop_items for update to authenticated
using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

drop policy if exists "shop admin deletes items" on public.shop_items;
create policy "shop admin deletes items" on public.shop_items for delete to authenticated
using (public.is_portfolio_admin());

revoke all on public.shop_items from anon, authenticated;
grant select, insert, update, delete on public.shop_items to authenticated;
grant execute on function public.is_portfolio_admin() to authenticated;

drop policy if exists "shop admin reads collections" on public.shop_collections;
create policy "shop admin reads collections" on public.shop_collections for select to authenticated
using (public.is_portfolio_admin());

drop policy if exists "shop admin creates collections" on public.shop_collections;
create policy "shop admin creates collections" on public.shop_collections for insert to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "shop admin updates collections" on public.shop_collections;
create policy "shop admin updates collections" on public.shop_collections for update to authenticated
using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

drop policy if exists "shop admin deletes collections" on public.shop_collections;
create policy "shop admin deletes collections" on public.shop_collections for delete to authenticated
using (public.is_portfolio_admin());

drop policy if exists "shop admin reads item collections" on public.shop_item_collections;
create policy "shop admin reads item collections" on public.shop_item_collections for select to authenticated
using (public.is_portfolio_admin());

drop policy if exists "shop admin creates item collections" on public.shop_item_collections;
create policy "shop admin creates item collections" on public.shop_item_collections for insert to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "shop admin deletes item collections" on public.shop_item_collections;
create policy "shop admin deletes item collections" on public.shop_item_collections for delete to authenticated
using (public.is_portfolio_admin());

revoke all on public.shop_collections from anon, authenticated;
revoke all on public.shop_item_collections from anon, authenticated;
grant select, insert, update, delete on public.shop_collections to authenticated;
grant select, insert, delete on public.shop_item_collections to authenticated;

drop policy if exists "shop admin reads settings" on public.shop_settings;
create policy "shop admin reads settings" on public.shop_settings for select to authenticated
using (public.is_portfolio_admin());

drop policy if exists "shop admin creates settings" on public.shop_settings;
create policy "shop admin creates settings" on public.shop_settings for insert to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "shop admin updates settings" on public.shop_settings;
create policy "shop admin updates settings" on public.shop_settings for update to authenticated
using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

revoke all on public.shop_settings from anon, authenticated;
grant select, insert, update on public.shop_settings to authenticated;

create or replace view public.public_shop_collections
with (security_barrier = true)
as
select id, name, slug, sort_order
from public.shop_collections
where is_visible = true
order by sort_order, name
limit 6;

revoke all on public.public_shop_collections from public;
grant select on public.public_shop_collections to anon, authenticated;

drop view if exists public.public_shop_settings;

create or replace view public.public_shop_settings
with (security_barrier = true)
as
select id, global_theme, hero_media_type, hero_icon_style, hero_image_url, hero_product_id, appearance_config
from public.shop_settings
where id = 'global';

revoke all on public.public_shop_settings from public;
grant select on public.public_shop_settings to anon, authenticated;

drop view if exists public.public_shop_items;
create view public.public_shop_items
with (security_barrier = true)
as
select
  id, slug, title, eyebrow, summary, description, main_image_url, gallery_urls,
  sizes, colors, customization_options, production_note, price_note, item_mode,
  item.request_subject, item.request_intro, item.theme, item.is_featured, item.created_at,
  coalesce((
    select jsonb_agg(collection.slug order by collection.sort_order, collection.name)
    from public.shop_item_collections membership
    join public.shop_collections collection on collection.id = membership.collection_id
    where membership.item_id = item.id and collection.is_visible = true
  ), '[]'::jsonb) as collection_slugs,
  item.shopify_product_url,
  item.availability_status
from public.shop_items item
where item.is_published = true;

revoke all on public.public_shop_items from public;
grant select on public.public_shop_items to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-media', 'shop-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop admin uploads media" on storage.objects;
create policy "shop admin uploads media" on storage.objects for insert to authenticated
with check (bucket_id = 'shop-media' and public.is_portfolio_admin());

drop policy if exists "shop admin updates media" on storage.objects;
create policy "shop admin updates media" on storage.objects for update to authenticated
using (bucket_id = 'shop-media' and public.is_portfolio_admin())
with check (bucket_id = 'shop-media' and public.is_portfolio_admin());

drop policy if exists "shop admin deletes media" on storage.objects;
create policy "shop admin deletes media" on storage.objects for delete to authenticated
using (bucket_id = 'shop-media' and public.is_portfolio_admin());

insert into public.shop_items (
  slug, title, eyebrow, summary, description, main_image_url, gallery_urls,
  sizes, colors, customization_options, production_note, price_note,
  item_mode, theme, is_published, is_featured
)
values (
  'studio-edition',
  'Studio Edition',
  'First study / demo piece',
  'A clean made-to-request piece shown here as the first test of the studio system.',
  'This temporary listing demonstrates the item system. Replace it with the first real piece when it is ready.',
  'images/items/demo-item.png',
  '["images/items/demo-item.png"]'::jsonb,
  '["Small", "Medium", "Large", "Additional sizes by request"]'::jsonb,
  '["Fresh green", "Cream", "A different color may be requested"]'::jsonb,
  '["Optional name or short phrase", "Font and placement discussed by email"]'::jsonb,
  'Final availability, production timing, shipping, and pricing are confirmed personally before payment.',
  'Final quote confirmed by email',
  'hybrid',
  'mono',
  false,
  false
)
on conflict (slug) do nothing;

insert into public.shop_collections (name, slug, sort_order)
values
  ('Semi-Customizable', 'semi-customizable', 10),
  ('Blanks', 'blanks', 20),
  ('Full Custom', 'full-custom', 30)
on conflict (slug) do nothing;

select 'shop setup completed successfully' as result;
