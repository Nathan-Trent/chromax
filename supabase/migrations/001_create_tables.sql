-- Chromax-MCR: all public tables (dependency order).
-- Prerequisite: run 000_utility_functions.sql so public.update_updated_at() exists.

-- 1. roles
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  permissions jsonb not null default '{}',
  is_system boolean default false,
  created_by uuid references auth.users (id),
  created_at timestamptz default now()
);

-- 2. products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  short_desc text,
  category text not null
    check (category in ('industrial','marine','automotive','architectural','custom')),
  images jsonb default '[]',
  price_ngn numeric(10,2),
  price_usd numeric(10,2),
  price_gbp numeric(10,2),
  bulk_tiers jsonb default '[]',
  min_b2b_price_ngn numeric(10,2),
  min_b2b_price_usd numeric(10,2),
  min_b2b_price_gbp numeric(10,2),
  stock integer default 0,
  low_threshold integer default 20,
  tds_url text,
  msds_url text,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  status text default 'draft'
    check (status in ('draft','live','archived')),
  erp_product_id text,
  created_by uuid references auth.users (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index products_category_idx on public.products (category);
create index products_status_idx on public.products (status);
create index products_slug_idx on public.products (slug);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

-- 3. colour_swatches
create table public.colour_swatches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex text not null
    check (hex ~ '^[0-9A-Fa-f]{6}$'),
  product_code text not null,
  category text not null
    check (category in ('automotive','marine','architectural','industrial')),
  product_id uuid references public.products (id) on delete set null,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index swatches_category_idx on public.colour_swatches (category);
create index swatches_active_idx on public.colour_swatches (active);

create trigger colour_swatches_updated_at
  before update on public.colour_swatches
  for each row execute function public.update_updated_at();

-- 4. customers
create table public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  company text,
  account_type text default 'retail'
    check (account_type in ('retail','trade')),
  preferred_currency text default 'NGN'
    check (preferred_currency in ('NGN','USD','GBP')),
  saved_addresses jsonb default '[]',
  marketing_consent boolean default false,
  erp_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.update_updated_at();

-- 5. orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_id uuid references auth.users (id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  items jsonb not null,
  subtotal numeric(10,2) not null,
  shipping_cost numeric(10,2) default 0,
  total numeric(10,2) not null,
  currency text not null check (currency in ('NGN','USD','GBP')),
  status text default 'new'
    check (status in ('new','confirmed','packed','dispatched','delivered','cancelled')),
  payment_status text default 'pending'
    check (payment_status in ('pending','paid','refunded','failed')),
  payment_method text check (payment_method in ('paystack','stripe')),
  payment_ref text,
  tracking_number text,
  courier text,
  shipping_address jsonb not null,
  notes text,
  source text default 'website'
    check (source in ('website','erp','phone')),
  erp_synced_at timestamptz,
  erp_order_id text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  refund_amount numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index orders_customer_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_reference_idx on public.orders (reference);
create index orders_created_at_idx on public.orders (created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

-- 6. b2b_offers
create table public.b2b_offers (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  buyer_email text not null,
  buyer_name text not null,
  buyer_company text,
  buyer_country text,
  buyer_phone text,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_code text not null,
  quantity integer not null,
  offered_price numeric(10,2) not null,
  currency text not null check (currency in ('NGN','USD','GBP')),
  list_price numeric(10,2) not null,
  min_price numeric(10,2),
  status text default 'pending'
    check (status in ('pending','reviewing','countered','accepted','declined','expired','converted')),
  thread jsonb default '[]',
  auto_counter_at timestamptz,
  responded_at timestamptz,
  accepted_at timestamptz,
  order_id uuid references public.orders (id) on delete set null,
  assigned_to uuid references auth.users (id) on delete set null,
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index b2b_status_idx on public.b2b_offers (status);
create index b2b_buyer_email_idx on public.b2b_offers (buyer_email);
create index b2b_created_at_idx on public.b2b_offers (created_at desc);

create trigger b2b_offers_updated_at
  before update on public.b2b_offers
  for each row execute function public.update_updated_at();

-- 7. user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  role_id uuid references public.roles (id) on delete cascade,
  assigned_by uuid references auth.users (id),
  created_at timestamptz default now(),
  unique (user_id, role_id)
);

-- 8. approval_workflows
create table public.approval_workflows (
  id uuid primary key default gen_random_uuid(),
  action_type text unique not null,
  label text not null,
  approver_role_id uuid references public.roles (id) on delete set null,
  notification_channels jsonb default '["in_app","email"]',
  draft_until_approved boolean default true,
  is_active boolean default true,
  created_by uuid references auth.users (id),
  updated_at timestamptz default now()
);

create trigger approval_workflows_updated_at
  before update on public.approval_workflows
  for each row execute function public.update_updated_at();

-- 9. pending_changes
create table public.pending_changes (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.approval_workflows (id) on delete cascade,
  action_type text not null,
  section text not null,
  record_id text,
  record_label text,
  submitted_by uuid references auth.users (id),
  before_values jsonb,
  after_values jsonb not null,
  status text default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  approver_id uuid references auth.users (id),
  approver_comment text,
  actioned_at timestamptz,
  created_at timestamptz default now()
);

create index pending_status_idx on public.pending_changes (status);
create index pending_submitted_by_idx on public.pending_changes (submitted_by);

-- 10. audit_log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_role text,
  action_type text not null,
  section text not null,
  record_id text,
  record_label text,
  before_values jsonb,
  after_values jsonb,
  source text not null
    check (source in ('dashboard','erp','ai','system')),
  pending_change_id uuid,
  ip_address text,
  created_at timestamptz default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_action_type_idx on public.audit_log (action_type);
create index audit_log_user_id_idx on public.audit_log (user_id);

-- 11. erp_sync_log
create table public.erp_sync_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  direction text not null check (direction in ('dashboard_to_erp','erp_to_dashboard')),
  source text not null check (source in ('dashboard','erp','ai','system')),
  record_id text,
  payload jsonb,
  status text not null check (status in ('success','failed','retrying','dead_letter')),
  attempt_count integer default 1,
  error_message text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create index erp_sync_status_idx on public.erp_sync_log (status);
create index erp_sync_created_at_idx on public.erp_sync_log (created_at desc);

-- 12. content_pages
create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text unique not null,
  title text,
  content jsonb not null default '{}',
  status text default 'draft' check (status in ('draft','live')),
  last_edited_by uuid references auth.users (id),
  updated_at timestamptz default now()
);

create trigger content_pages_updated_at
  before update on public.content_pages
  for each row execute function public.update_updated_at();

-- 13. blog_posts
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  body_html text,
  cover_image_url text,
  author_id uuid references auth.users (id),
  author_name text,
  tags text[],
  post_type text default 'blog'
    check (post_type in ('blog','guide')),
  status text default 'draft'
    check (status in ('draft','live','archived')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index blog_status_idx on public.blog_posts (status);
create index blog_published_at_idx on public.blog_posts (published_at desc);

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.update_updated_at();

-- 14. projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  body_html text,
  sector text,
  client_name text,
  location text,
  photos jsonb default '[]',
  product_ids uuid[],
  is_case_study boolean default false,
  status text default 'draft'
    check (status in ('draft','live','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at();

-- 15. certifications
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cert_type text not null
    check (cert_type in ('iso','export_licence','msds','award','other')),
  issuing_body text,
  issue_date date,
  expiry_date date,
  document_url text,
  product_id uuid references public.products (id) on delete set null,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger certifications_updated_at
  before update on public.certifications
  for each row execute function public.update_updated_at();

-- 16. ai_leads
create table public.ai_leads (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text,
  email text,
  phone text,
  company text,
  country text,
  product_interest text,
  project_description text,
  conversation_summary text,
  status text default 'new'
    check (status in ('new','contacted','converted','lost')),
  erp_synced_at timestamptz,
  erp_lead_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index ai_leads_status_idx on public.ai_leads (status);
create index ai_leads_created_at_idx on public.ai_leads (created_at desc);

create trigger ai_leads_updated_at
  before update on public.ai_leads
  for each row execute function public.update_updated_at();


-- ========== Row Level Security ==========

-- products (per data models doc)
alter table public.products enable row level security;

create policy "public_read_live_products"
  on public.products for select
  using (status = 'live');

create policy "admin_all_products"
  on public.products for all
  using (auth.role() = 'authenticated');

-- colour_swatches: public reads active rows; staff full access when authenticated
alter table public.colour_swatches enable row level security;

create policy "public_read_active_swatches"
  on public.colour_swatches for select
  using (active = true);

create policy "admin_all_swatches"
  on public.colour_swatches for all
  using (auth.role() = 'authenticated');

-- customers
alter table public.customers enable row level security;

create policy "customers_select_own"
  on public.customers for select
  using (auth.uid() = id);

create policy "customers_update_own"
  on public.customers for update
  using (auth.uid() = id);

create policy "customers_insert_own"
  on public.customers for insert
  with check (auth.uid() = id);

-- orders (per data models doc)
alter table public.orders enable row level security;

create policy "customers_own_orders"
  on public.orders for select
  using (customer_id = auth.uid());

create policy "admin_all_orders"
  on public.orders for all
  using (auth.role() = 'authenticated');

-- b2b_offers (per data models doc)
alter table public.b2b_offers enable row level security;

create policy "admin_all_b2b"
  on public.b2b_offers for all
  using (auth.role() = 'authenticated');

-- roles
alter table public.roles enable row level security;

create policy "authenticated_read_roles"
  on public.roles for select
  using (auth.role() = 'authenticated');

create policy "authenticated_manage_roles"
  on public.roles for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated_update_roles"
  on public.roles for update
  using (auth.role() = 'authenticated');

create policy "authenticated_delete_roles"
  on public.roles for delete
  using (auth.role() = 'authenticated');

-- user_roles
alter table public.user_roles enable row level security;

create policy "admin_all_user_roles"
  on public.user_roles for all
  using (auth.role() = 'authenticated');

-- approval_workflows
alter table public.approval_workflows enable row level security;

create policy "admin_all_approval_workflows"
  on public.approval_workflows for all
  using (auth.role() = 'authenticated');

-- pending_changes
alter table public.pending_changes enable row level security;

create policy "admin_all_pending_changes"
  on public.pending_changes for all
  using (auth.role() = 'authenticated');

-- audit_log (per data models doc — append-only)
alter table public.audit_log enable row level security;

create policy "audit_log_insert"
  on public.audit_log for insert
  with check (true);

create policy "admin_read_audit_log"
  on public.audit_log for select
  using (auth.role() = 'authenticated');

-- erp_sync_log
alter table public.erp_sync_log enable row level security;

create policy "admin_all_erp_sync_log"
  on public.erp_sync_log for all
  using (auth.role() = 'authenticated');

-- content_pages
alter table public.content_pages enable row level security;

create policy "public_read_live_content_pages"
  on public.content_pages for select
  using (status = 'live');

create policy "admin_all_content_pages"
  on public.content_pages for all
  using (auth.role() = 'authenticated');

-- blog_posts
alter table public.blog_posts enable row level security;

create policy "public_read_live_blog"
  on public.blog_posts for select
  using (status = 'live');

create policy "admin_all_blog"
  on public.blog_posts for all
  using (auth.role() = 'authenticated');

-- projects
alter table public.projects enable row level security;

create policy "public_read_live_projects"
  on public.projects for select
  using (status = 'live');

create policy "admin_all_projects"
  on public.projects for all
  using (auth.role() = 'authenticated');

-- certifications
alter table public.certifications enable row level security;

create policy "public_read_active_certifications"
  on public.certifications for select
  using (active = true);

create policy "admin_all_certifications"
  on public.certifications for all
  using (auth.role() = 'authenticated');

-- ai_leads
alter table public.ai_leads enable row level security;

create policy "admin_all_ai_leads"
  on public.ai_leads for all
  using (auth.role() = 'authenticated');
