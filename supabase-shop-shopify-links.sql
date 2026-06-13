begin;

alter table public.shop_items
  add column if not exists shopify_product_url text not null default '';

alter table public.shop_items
  add column if not exists availability_status text not null default 'request-only';

alter table public.shop_items
  drop constraint if exists shop_items_availability_status_check;

alter table public.shop_items
  add constraint shop_items_availability_status_check
  check (availability_status in ('available', 'coming-soon', 'sold-out', 'request-only'));

drop view if exists public.public_shop_items;
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

revoke all on public.public_shop_items from public;
grant select on public.public_shop_items to anon, authenticated;

commit;
