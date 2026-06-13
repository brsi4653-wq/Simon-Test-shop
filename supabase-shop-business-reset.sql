-- SHIPS CUSTOM CLOTHING CATALOGUE RESET
-- WARNING: This intentionally deletes every current shop item and collection.
-- Run this complete file once in the existing Supabase project's SQL Editor.

create extension if not exists pgcrypto;

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

delete from public.shop_item_collections;
delete from public.shop_items;
delete from public.shop_collections;

insert into public.shop_collections (name, slug, sort_order, is_visible)
values
  ('Pants', 'pants', 10, true),
  ('T-Shirts', 't-shirts', 20, true),
  ('Hoodies', 'hoodies', 30, true);

insert into public.shop_items (
  slug, title, eyebrow, summary, description, main_image_url, gallery_urls,
  sizes, colors, customization_options, production_note, price_note,
  item_mode, request_subject, request_intro, theme, is_published, is_featured
)
values
(
  'sunfade-oversized-hoodie',
  'Sunfade Oversized Hoodie',
  'Full custom / Hoodie',
  'A softly faded oversized hoodie ready to become a completely personal design.',
  'Start with this sunfaded oversized hoodie and send SHIPS your artwork, references, words, or rough concept. We will prepare a design suited to the garment, confirm placement and production details with you, and arrange fulfillment.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Sunfade Pink","Sunfade Steel"]'::jsonb,
  '["Front print","Back print","Sleeve details","Text or artwork","Placement planned around the faded finish"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'custom', '', '', 'red', true, false
),
(
  'contrast-collar-polo',
  'Contrast Collar Polo',
  'Limited placement / T-Shirt',
  'A polished contrast-collar polo for clean custom graphics, text, or small marks.',
  'Use this polo as the starting point for a refined custom garment. Send SHIPS your design idea and we will prepare artwork that respects the collar, button placket, and available print areas.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL","3XL"]'::jsonb,
  '["Wine / Cream"]'::jsonb,
  '["Small chest graphic","Back graphic","Text or simple artwork","Placement confirmed before production"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'red', true, false
),
(
  'layered-oversized-tee',
  'Layered Oversized Tee',
  'Full custom / T-Shirt',
  'An oversized layered tee with a strong silhouette and room for a complete custom concept.',
  'Send SHIPS finished artwork, references, text, or a rough idea. We will build a design around the layered shape and confirm the available placement options before arranging production.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Black / Layered White Sleeve"]'::jsonb,
  '["Front print","Back print","Text or artwork","Design prepared around the layered construction"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'custom', '', '', 'mono', true, false
),
(
  'contrast-track-jacket',
  'Contrast Track Jacket',
  'Limited placement / Outerwear',
  'A contrast track jacket for focused custom marks, wording, or coordinated graphics.',
  'This jacket works best with intentional placement and clean artwork. Send SHIPS your idea and we will adapt it to the available areas while preserving the jacket design.',
  '', '[]'::jsonb,
  '["XS","S","M","L","XL","2XL"]'::jsonb,
  '["Wine / Cream"]'::jsonb,
  '["Small chest graphic","Back graphic","Simple text","Placement confirmed before production"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'red', true, false
),
(
  'paint-detailed-heavyweight-tee',
  'Paint-Detailed Heavyweight Tee',
  'Limited placement / T-Shirt',
  'A heavyweight tee with restrained paint detailing, ready for a coordinated personal design.',
  'Use the existing paint details as part of the composition. Send SHIPS your artwork, text, or references and we will prepare a design that works with the garment rather than covering its character.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Apricot","Soft Rose","Powder Blue"]'::jsonb,
  '["Front graphic","Back graphic","Text or artwork","Design coordinated with existing paint details"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'orange', true, false
),
(
  'washed-oversized-tee',
  'Washed Oversized Tee',
  'Limited placement / T-Shirt',
  'A heavyweight washed oversized tee suited to bold artwork, simple marks, or text.',
  'Send SHIPS your artwork, reference images, wording, or rough concept. We will prepare it for the washed oversized garment and confirm the best placement before production.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL","3XL"]'::jsonb,
  '["Washed Black","Dusty Blue","Deep Indigo"]'::jsonb,
  '["Front print","Back print","Small chest mark","Text or artwork"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'mono', true, false
),
(
  'distressed-layered-long-sleeve',
  'Distressed Layered Long Sleeve',
  'Full custom / T-Shirt',
  'A distressed layered long sleeve ready for a complete custom clothing concept.',
  'Send SHIPS artwork, references, wording, or an early idea. We will develop a design around the layered sleeves and distressed finish, then confirm the final placement and production details.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Washed Black"]'::jsonb,
  '["Front print","Back print","Sleeve details","Text or artwork","Layer-aware placement"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'custom', '', '', 'mono', true, false
),
(
  'cloud-fade-tee',
  'Cloud Fade Tee',
  'Limited placement / T-Shirt',
  'A heavyweight cloud-fade tee for artwork designed around its soft tonal finish.',
  'Send SHIPS your design idea, artwork, or references. We will adapt the concept to the cloud-fade background and confirm a placement that remains clear and intentional.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Sky Fade"]'::jsonb,
  '["Front graphic","Back graphic","Small text or mark","Design coordinated with the fade"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'blue', true, false
),
(
  'vintage-black-denim',
  'Vintage Black Denim',
  'Limited placement / Pants',
  'Vintage black denim for restrained custom details and intentional placement.',
  'This denim is best suited to focused artwork, text, or small custom details. Send SHIPS your concept and we will confirm what can be produced cleanly on the garment.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Vintage Black"]'::jsonb,
  '["Small leg graphic","Text detail","Simple artwork","Placement confirmed before production"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'mono', true, false
),
(
  'washed-denim-zip-tee',
  'Washed Denim Zip Tee',
  'Limited placement / T-Shirt',
  'A washed denim zip tee for carefully placed custom artwork or lettering.',
  'Send SHIPS your idea, artwork, or references. We will prepare a design that works around the zip construction and confirm the available placement before production.',
  '', '[]'::jsonb,
  '["S","M","L","XL"]'::jsonb,
  '["Vintage Washed Black"]'::jsonb,
  '["Back graphic","Small chest graphic","Text or simple artwork","Zip-aware placement"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'mono', true, false
),
(
  'dirty-wash-zip-hoodie',
  'Dirty Wash Zip Hoodie',
  'Limited placement / Hoodie',
  'A heavyweight dirty-wash zip hoodie ready for a custom design built around its finish.',
  'Send SHIPS artwork, references, words, or a rough idea. We will adapt the design to the washed texture and zip construction, then confirm production and shipping details.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Dirty Wash Grey"]'::jsonb,
  '["Back print","Small chest graphic","Sleeve details","Zip-aware placement"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'blue', true, false
),
(
  'dirty-wash-sweatpants',
  'Dirty Wash Sweatpants',
  'Limited placement / Pants',
  'Heavyweight dirty-wash sweatpants for focused custom lettering, marks, or artwork.',
  'Send SHIPS your design idea or references. We will prepare it for the available leg placement and confirm the final design, garment availability, and fulfillment details.',
  '', '[]'::jsonb,
  '["S","M","L","XL","2XL"]'::jsonb,
  '["Dirty Wash Grey"]'::jsonb,
  '["Leg graphic","Small text or mark","Simple artwork","Placement confirmed before production"]'::jsonb,
  'Produced individually after the design, garment availability, price, and shipping details are confirmed.',
  'Final design quote confirmed by email',
  'hybrid', '', '', 'blue', true, false
);

insert into public.shop_item_collections (item_id, collection_id)
select item.id, collection.id
from public.shop_items item
join public.shop_collections collection on
  (collection.slug = 'hoodies' and item.slug in ('sunfade-oversized-hoodie', 'dirty-wash-zip-hoodie'))
  or (collection.slug = 'pants' and item.slug in ('vintage-black-denim', 'dirty-wash-sweatpants'))
  or (collection.slug = 't-shirts' and item.slug in (
    'contrast-collar-polo',
    'layered-oversized-tee',
    'paint-detailed-heavyweight-tee',
    'washed-oversized-tee',
    'distressed-layered-long-sleeve',
    'cloud-fade-tee',
    'washed-denim-zip-tee'
  ));

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

drop view if exists public.public_shop_items;
create view public.public_shop_items
with (security_barrier = true)
as
select
  item.id, item.slug, item.title, item.eyebrow, item.summary, item.description,
  item.main_image_url, item.gallery_urls, item.sizes, item.colors,
  item.customization_options, item.production_note, item.price_note, item.item_mode,
  item.request_subject, item.request_intro, item.theme, item.is_featured, item.created_at,
  coalesce((
    select jsonb_agg(collection.slug order by collection.sort_order, collection.name)
    from public.shop_item_collections membership
    join public.shop_collections collection on collection.id = membership.collection_id
    where membership.item_id = item.id and collection.is_visible = true
  ), '[]'::jsonb) as collection_slugs
from public.shop_items item
where item.is_published = true;

revoke all on public.public_shop_items from public;
grant select on public.public_shop_items to anon, authenticated;

select 'SHIPS catalogue reset completed: All is automatic; Pants, T-Shirts, and Hoodies are ready.' as result;
