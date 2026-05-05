# CLAUDE.md — Chromax-MCR Platform
# Read this file before touching any code in this project.
# This is the single source of truth for architecture, conventions, and decisions.

---

## What this project is

A full-stack e-commerce and operations platform for **Chromax-MCR**, a paint manufacturer based in Lagos, Nigeria with customers in the UK, USA, and Ukraine. The platform includes:

- A public-facing e-commerce site (retail B2C + B2B wholesale)
- A custom CMS and admin/operations dashboard
- A Colour Lab — interactive SVG colour visualiser
- An AI chat widget (external customer assistant)
- An AI business assistant embedded in the admin (internal)
- A bi-directional sync layer connecting to an existing Laravel ERP

The AI chat widget and business assistant are built as a **separate standalone Node.js system** that integrates with this platform. Do not mix the AI system code with the Next.js platform code.

---

## Repository structure

```
chromax/                          ← this repo (Next.js platform)
  src/
    app/
      (public)/                   ← public site pages (App Router)
        page.tsx                  ← homepage
        products/
          page.tsx                ← catalogue
          [slug]/page.tsx         ← product detail
        colour-lab/page.tsx       ← full Colour Lab page
        about/page.tsx
        certifications/page.tsx
        projects/page.tsx
        blog/
          page.tsx
          [slug]/page.tsx
        contact/page.tsx
        cart/page.tsx
        checkout/page.tsx
        account/
          orders/page.tsx
          offers/page.tsx
      (admin)/                    ← admin dashboard (protected)
        dashboard/page.tsx
        products/
          page.tsx
          [id]/page.tsx
          new/page.tsx
        content/page.tsx
        orders/
          page.tsx
          [id]/page.tsx
        b2b/
          page.tsx
          [id]/page.tsx
        colour-swatches/page.tsx
        certifications/page.tsx
        projects/page.tsx
        blog/page.tsx
        users/page.tsx
        workflows/page.tsx
        audit-log/page.tsx
        erp-sync/page.tsx
        ai-logs/page.tsx
      api/
        products/route.ts
        orders/route.ts
        b2b/route.ts
        swatches/route.ts
        auth/route.ts
        webhook/
          erp/route.ts            ← receives inbound ERP webhooks
    components/
      ui/                         ← design system primitives
        Button.tsx
        Card.tsx
        Badge.tsx
        Input.tsx
        Select.tsx
        Modal.tsx
        Table.tsx
        Tabs.tsx
        Toast.tsx
        Spinner.tsx
      public/                     ← public site components
        Nav.tsx
        Footer.tsx
        ProductCard.tsx
        ProductGrid.tsx
        ColourSwatch.tsx
        ColourLab.tsx
        AIWidget.tsx              ← embeds external AI widget
        HeroSection.tsx
        CategorySection.tsx
        TrustBar.tsx
      admin/                      ← admin components
        AdminNav.tsx
        AdminHeader.tsx
        DashboardWidget.tsx
        OrderRow.tsx
        OfferThread.tsx
        StatusPill.tsx
        ApprovalBadge.tsx
        AuditLogRow.tsx
        ERPSyncStatus.tsx
    lib/
      supabase/
        client.ts                 ← browser Supabase client
        server.ts                 ← server Supabase client
        queries/
          products.ts
          orders.ts
          b2b.ts
          swatches.ts
          users.ts
          content.ts
      erp/
        client.ts                 ← ERP REST API wrapper
        queue.ts                  ← Bull queue setup (outbound to ERP)
        events.ts                 ← event type constants
        webhook.ts                ← HMAC sign/verify
      payments/
        paystack.ts
        stripe.ts
      auth/
        middleware.ts
        roles.ts
      email/
        sender.ts
        templates/
    types/
      product.d.ts
      order.d.ts
      b2b.d.ts
      user.d.ts
      swatch.d.ts
      erp.d.ts
    styles/
      globals.css
  docs/                           ← spec documents (read before building)
  public/
    fonts/
    images/
  .env.local                      ← never commit this
```

---

## Tech stack — locked decisions, do not change

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS only | No inline styles, no CSS modules, no styled-components |
| Database | Supabase (PostgreSQL) | Use server client for server components, browser client for client components |
| Auth | Supabase Auth | Row Level Security enforced on all tables |
| Payments | Paystack (NGN) + Stripe (USD/GBP) | Currency auto-detected by IP |
| Queue | Bull + Redis | For outbound ERP sync events |
| ERP sync | Webhooks + REST | Laravel ERP on separate codebase — communicate via API only |
| AI widget | Standalone Node.js system | Embedded via script tag (external) or React component (internal). Do not build AI logic in this repo. |
| Fonts | Inter + Fraunces | Via next/font/google |
| Icons | Lucide React | No other icon library |
| Forms | React Hook Form + Zod | All forms must be validated |
| State | Zustand | Cart state, UI state. No Redux. |
| Email | Nodemailer | For order confirmations, approval notifications |

---

## Design system — never deviate from these

### Colours (CSS custom properties in globals.css)

```css
--color-navy: #1a1a2e;           /* hero, nav, footer, dark sections */
--color-navy-mid: #2D2D4E;       /* secondary dark surface */
--color-gold: #E8A020;           /* primary CTA, active states, highlights */
--color-gold-light: #FAEEDA;     /* gold background tints */
--color-gold-dark: #633806;      /* gold text on light backgrounds */
--color-warm-white: #F5F0E8;     /* page background */
--color-cream: #F0EAD6;          /* secondary surface */

/* Semantic */
--color-success: #1D9E75;        /* in stock, success states */
--color-error: #A32D2D;          /* out of stock, errors */
--color-warning: #BA7517;        /* low stock, warnings */
--color-info: #185FA5;           /* info, B2B badges */
--color-ai: #534AB7;             /* AI chat widget accent */
--color-verified: #3B6D11;       /* certified, verified states */
```

### Typography

```
Display/Hero:   Fraunces — 40–48px, weight 600, tracking -0.5px — hero headlines ONLY
H1:             Inter — 28–32px, weight 500
H2:             Inter — 22–24px, weight 500
H3:             Inter — 16–18px, weight 500
Body:           Inter — 14–15px, weight 400, line-height 1.7, color #555555
Caption/Label:  Inter — 11px, weight 500, uppercase, tracking 1.2px
Button:         Inter — 13–14px, weight 500, sentence case NEVER all-caps
```

### Spacing and shape

```
Base unit:      4px
Card padding:   20–24px
Card radius:    12px
Button radius:  8px
Input radius:   8px
Badge radius:   20px (fully rounded)
Nav height:     64px fixed
Max width:      1280px
Section padding: 64–96px vertical (desktop), 40px (mobile)
```

### Motion

```
All transitions:      150–200ms ease
Page transitions:     fade 250ms
Scroll reveals:       translateY(20px) → translateY(0), opacity 0 → 1
Colour Lab paint:     instant — no transition on colour change
Respect:              prefers-reduced-motion — no animation if set
```

---

## Supabase schema — key tables

### products
```sql
id              uuid primary key default gen_random_uuid()
name            text not null
slug            text unique not null
description     text
category        text not null  -- 'industrial'|'marine'|'automotive'|'architectural'|'custom'
images          jsonb          -- [{url, alt, isPrimary}]
price_ngn       numeric(10,2)
price_usd       numeric(10,2)
price_gbp       numeric(10,2)
bulk_tiers      jsonb          -- [{min_qty, price_ngn, price_usd, price_gbp}]
stock           integer default 0
low_threshold   integer default 20
tds_url         text           -- PDF URL
seo_title       text
seo_description text
status          text default 'draft'  -- 'draft'|'live'|'archived'
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### orders
```sql
id              uuid primary key default gen_random_uuid()
reference       text unique not null  -- e.g. CX-2025-0891
customer_id     uuid references auth.users
items           jsonb          -- [{product_id, name, variant, qty, unit_price, currency}]
total           numeric(10,2)
currency        text           -- 'NGN'|'USD'|'GBP'
status          text default 'new'  -- 'new'|'confirmed'|'packed'|'dispatched'|'delivered'|'cancelled'
payment_status  text           -- 'pending'|'paid'|'refunded'
payment_method  text           -- 'paystack'|'stripe'
tracking_number text
shipping_address jsonb
source          text default 'dashboard'  -- 'dashboard'|'erp'
erp_synced_at  timestamptz
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### b2b_offers
```sql
id              uuid primary key default gen_random_uuid()
reference       text unique not null  -- e.g. B2B-2025-0044
buyer_email     text not null
buyer_company   text
product_id      uuid references products
quantity        integer
offered_price   numeric(10,2)
currency        text
list_price      numeric(10,2)
min_price       numeric(10,2)   -- internal only, never expose to buyer
status          text default 'pending'  -- 'pending'|'countered'|'accepted'|'declined'|'expired'
thread          jsonb           -- [{from, price, message, timestamp}]
auto_counter_at timestamptz     -- when auto-counter fires
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### colour_swatches
```sql
id              uuid primary key default gen_random_uuid()
name            text not null
hex             text not null   -- validated: must match /^[0-9A-Fa-f]{6}$/
product_code    text not null
category        text not null   -- 'automotive'|'marine'|'architectural'|'industrial'
product_id      uuid references products
display_order   integer default 0
active          boolean default true
created_at      timestamptz default now()
```

### roles
```sql
id              uuid primary key default gen_random_uuid()
name            text unique not null
permissions     jsonb  -- {section: {view, create, edit, delete, approve}}
created_by      uuid references auth.users
created_at      timestamptz default now()
```

### audit_log
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users
user_email      text
action_type     text        -- e.g. 'product.price_updated'
section         text        -- e.g. 'products'
record_id       text
before_values   jsonb
after_values    jsonb
source          text        -- 'dashboard'|'erp'|'ai'|'system'
approval_chain  jsonb       -- [{approver, status, timestamp, comment}]
created_at      timestamptz default now()
```

### approval_workflows
```sql
id              uuid primary key default gen_random_uuid()
action_type     text unique not null  -- e.g. 'product.price_updated'
approver_role   uuid references roles
notification_channels jsonb  -- ['in_app', 'email']
draft_until_approved  boolean default true
created_at      timestamptz default now()
```

---

## ERP sync — critical rules

**Source of truth:**
- Stock levels → ERP always wins. Dashboard reads only, never writes.
- Product pricing → Dashboard wins (after accountant approval). One direction only.
- Order status → Last write by timestamp. Conflicts within 5s flagged for manual review.
- B2B offers → Dashboard during negotiation. ERP takes over once accepted.
- Leads → Dashboard → ERP only. One direction.

**Every event payload must include:**
```json
{
  "event_type": "order.status_updated",
  "source": "dashboard",
  "timestamp": "2025-04-23T10:02:17Z",
  "record_id": "CX-2025-0891",
  "triggered_by": "user@email.com",
  "data": {},
  "signature": "sha256=..."
}
```

**Webhook endpoint:** `POST /api/webhook/erp` — validates HMAC-SHA256 signature before processing anything.

**Queue:** All outbound events go through Bull queue before firing. 5 retry attempts with exponential backoff. Dead-letter after 5 failures.

See `/docs/chromax-erp-sync-spec.html` for full event contract table and file structure.

---

## Payments

**Paystack** — NGN only. Nigerian cards, bank transfer, USSD.
- Use Paystack Inline JS for checkout
- Webhook: `POST /api/webhook/paystack` — verify signature with `x-paystack-signature`
- On success: create order, update status to 'confirmed', fire ERP sync event

**Stripe** — USD and GBP only. International cards.
- Use Stripe Payment Element
- Webhook: `POST /api/webhook/stripe` — verify with Stripe webhook secret
- On success: same flow as Paystack

**Currency detection:**
- Detect by IP on first load using a geolocation API
- Store preference in localStorage and Zustand
- Manual switcher in nav — always visible
- Nigeria → NGN + Paystack. UK/USA/Ukraine → USD or GBP + Stripe

---

## Admin — RBAC rules

- Every admin route must check role permissions before rendering
- Permissions checked server-side in the layout, not just client-side
- Super admin role ID stored in env var: `SUPER_ADMIN_ROLE_ID`
- If a user's role has no access to a section — redirect to dashboard, never show a locked/greyed state
- All admin actions that have an approval workflow → create a pending record, do not apply immediately
- Approval workflows fetched from `approval_workflows` table — never hardcoded

---

## Colour Lab — implementation rules

- SVG objects are defined in `/src/components/public/ColourLab/svgs/`
- One SVG file per category: `Car.tsx`, `House.tsx`, `Ship.tsx`, `Industrial.tsx`
- Paintable parts are named SVG paths/groups with a `data-part` attribute
- Colour change applied by updating `fill` on the selected `data-part` element
- Colour change is instant — no CSS transition on fill
- Swatch data fetched from Supabase `colour_swatches` table at runtime
- URL parameters: `/colour-lab?category=auto&colour=CX-AUTO-B04&part=body`
- On load: read URL params, pre-apply the colour to the specified part
- "Add to cart" on Colour Lab adds the linked product with the selected colour as a variant

**What staff can change (CMS):** swatch name, hex code, product code, display order, active/inactive.
**What staff cannot change:** SVG paths, which parts are paintable, interaction logic.

---

## AI widget integration

The AI system is a **separate standalone Node.js service**. This Next.js repo does not contain AI logic.

**External widget:** Loaded via script tag in the root layout. The widget JS is served from the AI system's CDN.
```html
<script
  src="https://cdn.ai-system.com/widget.js"
  data-client="CHROMAX-001"
  data-mode="external"
  defer
/>
```

**Internal widget (admin):** Loaded as an iframe inside the admin layout.
```tsx
<iframe
  src="https://ai-system.com/embed/internal?client=CHROMAX-001"
  className="fixed bottom-4 right-4 w-80 h-96 border-0 rounded-xl shadow-xl"
/>
```

Do not try to call Claude API or any AI endpoint directly from this repo.

---

## Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payments
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ERP sync
ERP_BASE_URL=
ERP_API_TOKEN=
WEBHOOK_SECRET=                  # HMAC shared secret — both systems use this

# Queue
REDIS_URL=

# Email
SENDGRID_API_KEY=
EMAIL_FROM=noreply@chromax.com

# AI system
AI_SYSTEM_CLIENT_ID=CHROMAX-001
AI_SYSTEM_URL=

# App
NEXT_PUBLIC_APP_URL=
SUPER_ADMIN_ROLE_ID=
NEXT_PUBLIC_CURRENCY_DEFAULT=NGN
```

---

## Coding conventions

**TypeScript:**
- Strict mode always on
- No `any` — use `unknown` and type guard if needed
- All props interfaces defined above the component
- All API responses typed

**Components:**
- Server components by default — add `'use client'` only when needed
- Props interface named `[ComponentName]Props`
- Export as named export, not default (exception: page.tsx files)
- No business logic in components — move to lib/ functions

**Tailwind:**
- No arbitrary values unless absolutely unavoidable — use design tokens
- Responsive: mobile-first. `sm:` `md:` `lg:` prefixes
- Dark sections use `bg-[#1a1a2e]` — the navy. Never `bg-black`
- Product imagery is always the most colourful element — UI never competes

**API routes:**
- All routes return `{ data, error }` shape
- Errors return appropriate HTTP status codes — never 200 with an error in body
- All mutations go through approval workflow check before applying
- All mutations write to audit_log after applying

**Forms:**
- React Hook Form + Zod for all forms
- Zod schemas defined in `/src/lib/schemas/`
- Error messages in plain language — never technical jargon

**File naming:**
- Components: PascalCase (`ProductCard.tsx`)
- Utilities and hooks: camelCase (`useCart.ts`)
- Types: camelCase with `.d.ts` extension (`product.d.ts`)
- Pages: always `page.tsx` (App Router convention)

---

## What's been planned and specced

Full documentation in `/docs/`. Read before building each section:

| Doc | Read before building |
|---|---|
| `chromax-master-brief` | Everything — read this first |
| `chromax-frontend-design-spec` | Any UI component or page |
| `chromax-admin-system-spec` | Any admin page, RBAC, approval workflows |
| `chromax-operations-dashboard-spec` | Orders, B2B, AI chat log pages |
| `chromax-erp-sync-spec` | Any ERP sync code, webhook handlers, queue |
| `chromax-colour-lab` | Colour Lab component and swatch system |
| `ai-business-assistant-spec` | AI widget integration only — do not build AI logic here |

---

## Build order

**Current phase: Phase 1 — Public site and admin CMS**

1. Design tokens and globals (globals.css, fonts.ts)
2. Core UI components (Button, Card, Badge, Input, Select)
3. Layout components (Nav, Footer, AdminNav)
4. Homepage
5. Product catalogue and product detail pages
6. Colour Lab
7. About, certifications, projects, blog pages
8. Cart and checkout (Paystack + Stripe)
9. Admin — product manager, content editor, colour swatches
10. Admin — RBAC, users, approval workflows
11. Admin — orders and B2B operations
12. ERP sync layer
13. AI widget integration

**Do not start Phase 2 (AI system) until Phase 1 is complete and live.**

---

## Key decisions — do not revisit these

- Tailwind only — no other CSS approach
- App Router — no Pages Router patterns
- Supabase — no other database
- Bull + Redis — no other queue
- Paystack for NGN, Stripe for international — no other payment providers
- AI logic in a separate repo — never in this codebase
- No desktop app — web only for now
- No WhatsApp integration in this platform — email only for admin notifications
- ERP is a separate Laravel system — communicate via API only, never import Laravel code

---

*Last updated: 2025 · Maintained by the Chromax platform developer*
*All architecture decisions documented in /docs — read before asking AI to generate code*