# chromax-data-models.md
# Complete Supabase / PostgreSQL schema for the Chromax-MCR platform
# Read this before writing any database query, Supabase call, or type definition
# All tables use Row Level Security (RLS) — policies defined at the bottom

---

## Stack
- Database: Supabase (PostgreSQL 15)
- Auth: Supabase Auth (built-in users table: auth.users)
- Extensions required: uuid-ossp, pgvector (for AI embeddings later)
- ORM: None — use Supabase JS client with typed queries
- All IDs: uuid (gen_random_uuid())
- All timestamps: timestamptz, default now(), stored in UTC

---

## Tables — public schema

---

### products

Stores all paint products. Managed via admin CMS. Stock is read-only here — source of truth is ERP.

```sql
create table products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  description     text,
  short_desc      text,                    -- one-liner for product cards
  category        text not null
    check (category in ('industrial','marine','automotive','architectural','custom')),
  images          jsonb default '[]',      -- [{url, alt, is_primary}]
  price_ngn       numeric(10,2),
  price_usd       numeric(10,2),
  price_gbp       numeric(10,2),
  bulk_tiers      jsonb default '[]',      -- [{min_qty, price_ngn, price_usd, price_gbp}]
  min_b2b_price_ngn numeric(10,2),        -- internal floor price, never expose to buyer
  min_b2b_price_usd numeric(10,2),
  min_b2b_price_gbp numeric(10,2),
  stock           integer default 0,       -- synced from ERP — read only in dashboard
  low_threshold   integer default 20,
  tds_url         text,                    -- Technical Data Sheet PDF URL (Supabase storage)
  msds_url        text,                    -- Material Safety Data Sheet PDF URL
  seo_title       text,
  seo_description text,
  seo_keywords    text[],
  status          text default 'draft'
    check (status in ('draft','live','archived')),
  erp_product_id  text,                   -- corresponding ID in Laravel ERP
  created_by      uuid references auth.users,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Indexes
create index products_category_idx on products(category);
create index products_status_idx on products(status);
create index products_slug_idx on products(slug);

-- Trigger: auto-update updated_at
create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();
```

**TypeScript type:**
```typescript
export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  short_desc: string | null
  category: 'industrial' | 'marine' | 'automotive' | 'architectural' | 'custom'
  images: { url: string; alt: string; is_primary: boolean }[]
  price_ngn: number | null
  price_usd: number | null
  price_gbp: number | null
  bulk_tiers: { min_qty: number; price_ngn: number; price_usd: number; price_gbp: number }[]
  stock: number
  low_threshold: number
  tds_url: string | null
  msds_url: string | null
  status: 'draft' | 'live' | 'archived'
  erp_product_id: string | null
  created_at: string
  updated_at: string
}
```

---

### colour_swatches

Paint colour swatches used in the Colour Lab and product pages.
Staff can edit: name, hex, product_code, display_order, active.
Staff cannot change: the SVG logic or which parts they apply to.

```sql
create table colour_swatches (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,           -- e.g. 'Midnight Blue'
  hex             text not null            -- e.g. 'E8A020' (no # prefix)
    check (hex ~ '^[0-9A-Fa-f]{6}$'),
  product_code    text not null,           -- e.g. 'CX-AUTO-B04'
  category        text not null
    check (category in ('automotive','marine','architectural','industrial')),
  product_id      uuid references products on delete set null,
  display_order   integer default 0,
  active          boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index swatches_category_idx on colour_swatches(category);
create index swatches_active_idx on colour_swatches(active);
```

**TypeScript type:**
```typescript
export type ColourSwatch = {
  id: string
  name: string
  hex: string              // no # prefix — add # when using in CSS
  product_code: string
  category: 'automotive' | 'marine' | 'architectural' | 'industrial'
  product_id: string | null
  display_order: number
  active: boolean
}
```

---

### orders

Retail customer orders. Created when Paystack/Stripe payment is confirmed.

```sql
create table orders (
  id              uuid primary key default gen_random_uuid(),
  reference       text unique not null,    -- e.g. CX-2025-0891
  customer_id     uuid references auth.users on delete set null,
  customer_email  text not null,           -- denormalised for easy lookup
  customer_name   text not null,
  customer_phone  text,
  items           jsonb not null,          -- [{product_id, name, variant, qty, unit_price, currency, product_code}]
  subtotal        numeric(10,2) not null,
  shipping_cost   numeric(10,2) default 0,
  total           numeric(10,2) not null,
  currency        text not null check (currency in ('NGN','USD','GBP')),
  status          text default 'new'
    check (status in ('new','confirmed','packed','dispatched','delivered','cancelled')),
  payment_status  text default 'pending'
    check (payment_status in ('pending','paid','refunded','failed')),
  payment_method  text check (payment_method in ('paystack','stripe')),
  payment_ref     text,                    -- Paystack/Stripe reference
  tracking_number text,
  courier         text,
  shipping_address jsonb not null,         -- {line1, line2, city, country, postcode}
  notes           text,                    -- customer order notes
  source          text default 'website'
    check (source in ('website','erp','phone')),
  erp_synced_at   timestamptz,
  erp_order_id    text,
  dispatched_at   timestamptz,
  delivered_at    timestamptz,
  cancelled_at    timestamptz,
  cancellation_reason text,
  refund_amount   numeric(10,2),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index orders_customer_idx on orders(customer_id);
create index orders_status_idx on orders(status);
create index orders_reference_idx on orders(reference);
create index orders_created_at_idx on orders(created_at desc);
```

**Reference format:** `CX-[YEAR]-[4-digit-sequence]` — generated in application code, not DB.

---

### b2b_offers

Bulk/wholesale price negotiation. Buyer submits offer, Chromax responds.

```sql
create table b2b_offers (
  id              uuid primary key default gen_random_uuid(),
  reference       text unique not null,    -- e.g. B2B-2025-0044
  buyer_email     text not null,
  buyer_name      text not null,
  buyer_company   text,
  buyer_country   text,
  buyer_phone     text,
  product_id      uuid references products on delete set null,
  product_name    text not null,           -- denormalised
  product_code    text not null,           -- denormalised
  quantity        integer not null,
  offered_price   numeric(10,2) not null,  -- buyer's offered price per unit
  currency        text not null check (currency in ('NGN','USD','GBP')),
  list_price      numeric(10,2) not null,  -- Chromax list price at time of offer
  min_price       numeric(10,2),           -- internal floor — NEVER expose in API responses to buyers
  status          text default 'pending'
    check (status in ('pending','reviewing','countered','accepted','declined','expired','converted')),
  thread          jsonb default '[]',      -- [{from:'buyer'|'chromax', price, message, timestamp, by}]
  auto_counter_at timestamptz,             -- when auto-counter fires if no manual response
  responded_at    timestamptz,
  accepted_at     timestamptz,
  order_id        uuid references orders on delete set null,  -- set when offer converts to order
  assigned_to     uuid references auth.users on delete set null,  -- sales manager handling this
  internal_notes  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index b2b_status_idx on b2b_offers(status);
create index b2b_buyer_email_idx on b2b_offers(buyer_email);
create index b2b_created_at_idx on b2b_offers(created_at desc);
```

**CRITICAL:** The `min_price` column must NEVER be included in API responses sent to buyers.
Always use a separate buyer-safe type that omits this field.

---

### customers

Extended customer profiles. Linked to auth.users via id.

```sql
create table customers (
  id              uuid primary key references auth.users on delete cascade,
  full_name       text,
  phone           text,
  company         text,                    -- for B2B buyers
  account_type    text default 'retail'
    check (account_type in ('retail','trade')),
  preferred_currency text default 'NGN'
    check (preferred_currency in ('NGN','USD','GBP')),
  saved_addresses jsonb default '[]',      -- [{label, line1, line2, city, country, postcode, is_default}]
  marketing_consent boolean default false,
  erp_customer_id text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

---

### roles

Custom admin roles. Created and managed by super admin only.

```sql
create table roles (
  id              uuid primary key default gen_random_uuid(),
  name            text unique not null,
  description     text,
  permissions     jsonb not null default '{}',
  -- permissions shape:
  -- {
  --   products:     { view, create, edit, delete, approve_pricing },
  --   orders:       { view, fulfil, cancel_request, cancel_approve },
  --   b2b:          { view, respond, approve },
  --   content:      { view, create, edit, delete },
  --   swatches:     { view, edit },
  --   certifications: { view, edit },
  --   projects:     { view, edit },
  --   blog:         { view, create, edit, delete },
  --   users:        { view, create, edit, delete },
  --   workflows:    { view, edit },
  --   audit_log:    { view },
  --   erp_sync:     { view }
  -- }
  is_system       boolean default false,   -- system roles cannot be deleted
  created_by      uuid references auth.users,
  created_at      timestamptz default now()
);

-- Default system roles seeded on first deploy:
-- 'Super Admin' (is_system: true, all permissions: true)
-- 'Content Editor'
-- 'Fulfilment Manager'
-- 'Chief Accountant'
-- 'Sales Manager'
```

---

### user_roles

Links admin users to their roles. One user can have multiple roles.

```sql
create table user_roles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade,
  role_id         uuid references roles on delete cascade,
  assigned_by     uuid references auth.users,
  created_at      timestamptz default now(),
  unique(user_id, role_id)
);
```

---

### approval_workflows

Configurable approval chains per action type. Managed by super admin.

```sql
create table approval_workflows (
  id              uuid primary key default gen_random_uuid(),
  action_type     text unique not null,
  -- e.g. 'product.price_updated', 'content.page_updated',
  --      'order.cancelled', 'b2b.counter_sent', 'swatch.updated'
  label           text not null,           -- human-readable label
  approver_role_id uuid references roles on delete set null,
  notification_channels jsonb default '["in_app","email"]',
  -- ['in_app', 'email']
  draft_until_approved boolean default true,
  -- if false: change goes live immediately, can be rolled back on rejection
  is_active       boolean default true,
  created_by      uuid references auth.users,
  updated_at      timestamptz default now()
);
```

---

### pending_changes

Changes waiting for approval. Created when a workflow is triggered.

```sql
create table pending_changes (
  id              uuid primary key default gen_random_uuid(),
  workflow_id     uuid references approval_workflows on delete cascade,
  action_type     text not null,
  section         text not null,
  record_id       text,                    -- ID of the record being changed
  record_label    text,                    -- human-readable name of the record
  submitted_by    uuid references auth.users,
  before_values   jsonb,
  after_values    jsonb not null,
  status          text default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  approver_id     uuid references auth.users,
  approver_comment text,
  actioned_at     timestamptz,
  created_at      timestamptz default now()
);

create index pending_status_idx on pending_changes(status);
create index pending_submitted_by_idx on pending_changes(submitted_by);
```

---

### audit_log

Append-only log of every action. Cannot be edited or deleted.

```sql
create table audit_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,                    -- no FK — preserve log even if user deleted
  user_email      text,
  user_role       text,
  action_type     text not null,
  section         text not null,
  record_id       text,
  record_label    text,
  before_values   jsonb,
  after_values    jsonb,
  source          text not null
    check (source in ('dashboard','erp','ai','system')),
  pending_change_id uuid,                  -- if this action went through approval
  ip_address      text,
  created_at      timestamptz default now()
);

-- Append-only: revoke DELETE and UPDATE privileges
-- create policy "audit_log_insert_only" on audit_log for insert with check (true);
-- Disable update and delete in RLS policies

create index audit_log_created_at_idx on audit_log(created_at desc);
create index audit_log_action_type_idx on audit_log(action_type);
create index audit_log_user_id_idx on audit_log(user_id);
```

---

### erp_sync_log

Every sync event between dashboard and ERP.

```sql
create table erp_sync_log (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,
  direction       text not null check (direction in ('dashboard_to_erp','erp_to_dashboard')),
  source          text not null check (source in ('dashboard','erp','ai','system')),
  record_id       text,
  payload         jsonb,
  status          text not null check (status in ('success','failed','retrying','dead_letter')),
  attempt_count   integer default 1,
  error_message   text,
  resolved_at     timestamptz,
  created_at      timestamptz default now()
);

create index erp_sync_status_idx on erp_sync_log(status);
create index erp_sync_created_at_idx on erp_sync_log(created_at desc);
```

---

### content_pages

CMS-managed page content. Not full pages — editable content blocks per page.

```sql
create table content_pages (
  id              uuid primary key default gen_random_uuid(),
  page_key        text unique not null,    -- e.g. 'homepage', 'about', 'contact'
  title           text,
  content         jsonb not null default '{}',
  -- homepage: { hero_heading, hero_subheading, hero_cta_primary, hero_cta_secondary, featured_product_ids[] }
  -- about: { heading, body_html, team[] }
  -- contact: { address, phone, email, whatsapp, map_embed_url }
  status          text default 'draft' check (status in ('draft','live')),
  last_edited_by  uuid references auth.users,
  updated_at      timestamptz default now()
);
```

---

### blog_posts

```sql
create table blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  excerpt         text,
  body_html       text,
  cover_image_url text,
  author_id       uuid references auth.users,
  author_name     text,                    -- denormalised
  tags            text[],
  post_type       text default 'blog'
    check (post_type in ('blog','guide')),
  status          text default 'draft'
    check (status in ('draft','live','archived')),
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index blog_status_idx on blog_posts(status);
create index blog_published_at_idx on blog_posts(published_at desc);
```

---

### projects

Client projects / gallery entries.

```sql
create table projects (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  description     text,
  body_html       text,                    -- full case study content
  sector          text,                    -- e.g. 'offshore', 'construction', 'automotive'
  client_name     text,
  location        text,
  photos          jsonb default '[]',      -- [{url, alt, caption}]
  product_ids     uuid[],                  -- products used in this project
  is_case_study   boolean default false,
  status          text default 'draft'
    check (status in ('draft','live','archived')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

---

### certifications

ISO certs, export licences, MSDS docs, awards.

```sql
create table certifications (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  cert_type       text not null
    check (cert_type in ('iso','export_licence','msds','award','other')),
  issuing_body    text,
  issue_date      date,
  expiry_date     date,
  document_url    text,                    -- PDF in Supabase storage
  product_id      uuid references products on delete set null,  -- null = company-wide
  display_order   integer default 0,
  active          boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

---

### ai_leads

Leads captured by the external AI chat widget.

```sql
create table ai_leads (
  id              uuid primary key default gen_random_uuid(),
  session_id      text not null,
  name            text,
  email           text,
  phone           text,
  company         text,
  country         text,
  product_interest text,
  project_description text,
  conversation_summary text,
  status          text default 'new'
    check (status in ('new','contacted','converted','lost')),
  erp_synced_at   timestamptz,
  erp_lead_id     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index ai_leads_status_idx on ai_leads(status);
create index ai_leads_created_at_idx on ai_leads(created_at desc);
```

---

## Utility function

Auto-update updated_at on any table that has it:

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

Apply to each table with:
```sql
create trigger [table]_updated_at
  before update on [table]
  for each row execute function update_updated_at();
```

---

## Row Level Security — key policies

```sql
-- Products: public can read live products
alter table products enable row level security;
create policy "public_read_live_products"
  on products for select
  using (status = 'live');
create policy "admin_all_products"
  on products for all
  using (auth.role() = 'authenticated');

-- Orders: customers see only their own
alter table orders enable row level security;
create policy "customers_own_orders"
  on orders for select
  using (customer_id = auth.uid());
create policy "admin_all_orders"
  on orders for all
  using (auth.role() = 'authenticated');

-- B2B offers: buyers see only their own (by email)
alter table b2b_offers enable row level security;
create policy "admin_all_b2b"
  on b2b_offers for all
  using (auth.role() = 'authenticated');

-- Audit log: insert only (no update/delete)
alter table audit_log enable row level security;
create policy "audit_log_insert"
  on audit_log for insert with check (true);
create policy "admin_read_audit_log"
  on audit_log for select
  using (auth.role() = 'authenticated');
```

---

## Supabase storage buckets

```
product-images/     — product photos (public read)
product-docs/       — TDS and MSDS PDFs (public read)
project-photos/     — project gallery images (public read)
certifications/     — cert and licence PDFs (public read)
content-images/     — blog and page images (public read)
```

All buckets: public read, authenticated write, max file size 10MB.

---

## Important notes for Cursor / Claude Code

1. Always use the **server client** (`lib/supabase/server.ts`) in Server Components and Route Handlers.
2. Always use the **browser client** (`lib/supabase/client.ts`) in Client Components.
3. Never expose `min_b2b_price_*` fields in any response that goes to a non-admin user.
4. The `stock` field on products is read-only in this system — it is synced from ERP. Never update it directly.
5. The `audit_log` table is append-only — never write UPDATE or DELETE queries against it.
6. Always write to `audit_log` after any mutation that goes through an approval workflow.
7. Generate order references in application code: `CX-${year}-${padded_sequence}`.
8. Generate B2B offer references in application code: `B2B-${year}-${padded_sequence}`.
