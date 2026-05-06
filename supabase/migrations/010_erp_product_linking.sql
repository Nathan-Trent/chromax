-- ERP product linking (extends existing products.erp_product_id).
-- Note: 009 is used by audit_log_source_stripe; numbering continues at 010.

-- New columns
alter table public.products
  add column if not exists erp_product_name text;

alter table public.products
  add column if not exists erp_linked_at timestamptz;

alter table public.products
  add column if not exists erp_last_stock_sync timestamptz;

-- Migrate erp_product_id from legacy text to integer (nullable)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'erp_product_id'
      and data_type = 'text'
  ) then
    alter table public.products
      alter column erp_product_id type integer
      using (
        case
          when erp_product_id is null then null
          when trim(erp_product_id) ~ '^[0-9]+$' then trim(erp_product_id)::integer
          else null
        end
      );
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'erp_product_id'
  ) then
    alter table public.products
      add column erp_product_id integer;
  end if;
end $$;
