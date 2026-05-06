create table public.erp_sync_pending (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  direction text not null,
  erp_product_id integer,
  dashboard_product_id uuid references public.products (id) on delete set null,
  field_changed text,
  current_value jsonb,
  incoming_value jsonb,
  payload jsonb,
  status text default 'pending'
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'auto_applied',
        'undone'
      )
    ),
  auto_applied boolean default false,
  reviewed_by uuid references auth.users,
  reviewed_at timestamptz,
  review_note text,
  undone_at timestamptz,
  undone_by uuid references auth.users,
  created_at timestamptz default now()
);

create index erp_sync_pending_status_idx on public.erp_sync_pending (status);
create index erp_sync_pending_created_idx on public.erp_sync_pending (created_at desc);

alter table public.erp_sync_pending enable row level security;

create policy "admin_erp_sync_pending"
  on public.erp_sync_pending for all
  using (auth.role() = 'authenticated');
