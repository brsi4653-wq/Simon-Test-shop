-- SHIPS COLLECTIONS: STEP 2 OF 2
-- Run this entire file only after Step 1 returns both table names.
-- It adds security, public views, and the three initial collections.
-- It does not change or delete any existing items.

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

create or replace view public.public_shop_items
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

insert into public.shop_collections (name, slug, sort_order)
values
  ('Semi-Customizable', 'semi-customizable', 10),
  ('Blanks', 'blanks', 20),
  ('Full Custom', 'full-custom', 30)
on conflict (slug) do nothing;

select 'shop collections setup completed successfully; existing items were not changed' as result;
