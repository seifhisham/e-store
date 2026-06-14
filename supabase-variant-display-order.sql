-- Preserve admin-defined variant order on product pages
alter table public.product_variants
  add column if not exists display_order int not null default 0;
