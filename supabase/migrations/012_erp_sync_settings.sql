create table public.erp_sync_settings (
  id uuid primary key default gen_random_uuid(),
  event_type text not null unique,
  label text not null,
  auto_sync boolean default false,
  undo_window_hours integer default 24,
  is_active boolean default true,
  updated_by uuid references auth.users,
  updated_at timestamptz default now()
);

alter table public.erp_sync_settings enable row level security;

create policy "admin_erp_sync_settings"
  on public.erp_sync_settings for all
  using (auth.role() = 'authenticated');

insert into public.erp_sync_settings
  (event_type, label, auto_sync, undo_window_hours)
values
  ('stock.updated', 'Stock level updates', false, 24),
  ('stock.low_threshold', 'Low stock alerts', false, 0),
  ('order.created', 'New orders from ERP', false, 48),
  ('order.status_updated', 'Order status changes', false, 24),
  ('product.updated', 'Product detail changes', false, 24),
  ('payment.confirmed', 'Payment confirmations', false, 48),
  ('b2b_offer.accepted', 'B2B offer acceptances', false, 48),
  ('lead.captured', 'AI lead captures', true, 24)
on conflict (event_type) do nothing;
