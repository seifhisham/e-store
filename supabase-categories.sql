-- Dynamic product categories (replaces static lib/categories.ts)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists categories_read_public on public.categories;
create policy categories_read_public on public.categories for select using (true);

-- Seed from the previous static categories list
insert into public.categories (value, label) values
  ('Denim', 'Denim'),
  ('KnitWear', 'KnitWear'),
  ('Cardigan', 'Cardigan'),
  ('Sweaters', 'Sweaters'),
  ('Jackets', 'Jackets'),
  ('Coats', 'Coats'),
  ('SweatPants', 'SweatPants'),
  ('Men', 'Men'),
  ('Unisex', 'Unisex')
on conflict (value) do nothing;

-- If you already ran an older version of this migration, clean up unused columns:
-- alter table public.categories drop column if exists image;
-- alter table public.categories drop column if exists sort_order;
