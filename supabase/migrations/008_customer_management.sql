-- Customer admin fields (suspend, internal notes).
-- Apply in Supabase Dashboard → SQL Editor → paste → Run.

alter table public.customers
  add column if not exists internal_notes text;

alter table public.customers
  add column if not exists suspended_at timestamptz;

alter table public.customers
  add column if not exists suspended_by uuid references auth.users (id);

alter table public.customers
  add column if not exists suspension_reason text;
