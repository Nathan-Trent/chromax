-- Platform settings (feature flags, publishable payment keys). Secrets stay in env only.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;

-- Authenticated dashboard users can manage settings.
create policy "admin_settings"
  on public.settings
  for all
  using (auth.role() = 'authenticated');

-- Anonymous + logged-in clients need to read public keys and flags for checkout UI.
create policy "settings_select_public"
  on public.settings
  for select
  using (true);

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at();

insert into public.settings (key, value) values
  ('paystack_enabled', 'true'::jsonb),
  ('stripe_enabled', 'true'::jsonb),
  ('supported_currencies', '["NGN","USD","GBP"]'::jsonb),
  ('paystack_public_key', '"pk_test_placeholder"'::jsonb),
  ('stripe_publishable_key', '"pk_test_placeholder"'::jsonb)
on conflict (key) do nothing;
