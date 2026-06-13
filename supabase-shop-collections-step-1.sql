-- SHIPS COLLECTIONS: STEP 1 OF 2
-- Run this entire file first. It only creates the two new collection tables.
-- It does not change or delete any existing items.

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

select
  to_regclass('public.shop_collections') as collections_table,
  to_regclass('public.shop_item_collections') as item_collections_table;
