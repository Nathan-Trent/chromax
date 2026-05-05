-- Notifications (in-app) and email delivery log.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_read_idx on public.notifications (read);

alter table public.notifications enable row level security;

create policy "users_own_notifications"
  on public.notifications
  for all
  using (user_id = auth.uid());

-- Optional: Supabase Realtime (ignore if publication not present in your environment).
alter publication supabase_realtime add table public.notifications;

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  template text not null,
  data jsonb default '{}',
  status text default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  skip_reason text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index email_log_status_idx on public.email_log (status);
create index email_log_created_at_idx on public.email_log (created_at desc);

alter table public.email_log enable row level security;

create policy "admin_email_log"
  on public.email_log
  for all
  using (auth.role() = 'authenticated');

insert into public.settings (key, value) values
  ('email_enabled', 'false'::jsonb),
  ('email_from_name', '"Chromax-MCR"'::jsonb),
  ('email_from_address', '"noreply@chromax-mcr.com"'::jsonb),
  ('email_reply_to', '"info@chromax-mcr.com"'::jsonb),
  ('email_smtp_host', '""'::jsonb),
  ('email_smtp_port', '587'::jsonb),
  ('email_smtp_username', '""'::jsonb),
  ('email_smtp_password_encrypted', '""'::jsonb),
  ('email_smtp_secure', 'false'::jsonb),
  (
    'email_notifications',
    '{
      "order_confirmation": true,
      "order_status_update": true,
      "b2b_offer_received": true,
      "b2b_offer_response": true,
      "approval_requested": true,
      "approval_actioned": true,
      "password_reset": true,
      "welcome": true,
      "staff_invite": true
    }'::jsonb
  )
on conflict (key) do nothing;
