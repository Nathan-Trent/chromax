-- Run this migration first (before 001_create_tables.sql).
-- Utility trigger: auto-update updated_at on tables that define a trigger.

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
