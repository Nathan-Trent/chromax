# Chromax-MCR Platform

Full-stack e-commerce and operations platform for a premium Nigerian paint manufacturer — built with Next.js, Supabase, and a bi-directional ERP sync layer.

Chromax-MCR manufactures industrial, marine, automotive, and architectural coatings in Lagos, Nigeria, serving customers across Nigeria, UK, USA and Ukraine. This platform replaces a manual sales process with a complete digital operation — online store, admin dashboard, B2B negotiation system, and real-time ERP synchronisation.

**Live:** https://chromax-mcr.com

---

## What this project demonstrates

This project was designed before a single line of code was written. Every architectural decision — from the non-blocking email system to the bi-directional ERP sync contract — was documented in a specification first and then built against that specification. The result is a system where business rules are explicit, email failure never blocks a customer transaction, and the ERP can be connected or disconnected without changing a line of dashboard code. The design applied Norman's usability principles and a "confident base with bold moments" visual philosophy specifically chosen for the West African and international market context.

---

## Platform overview

Six capability areas — each a paragraph:

### 1. E-commerce (B2C + B2B)

Multi-currency storefront (NGN via Paystack, USD/GBP via Stripe). Products, cart, checkout, order management, customer accounts. B2B wholesale system with price negotiation, counter-offer threads, and floor price visibility (internal only, never shown to buyer). The B2B negotiation flow was a product decision made during planning — not a requirement from the client — based on understanding how industrial paint buyers actually operate.

### 2. Interactive Colour Lab

Customers visualise Chromax paint colours on a house, car, vessel, or industrial structure before buying. The UX entry point — a simple colour picker on product pages that deep-links into the full visualiser with the colour pre-loaded — was a deliberate product proposal. It reduces the barrier to trying the feature from requiring navigation to making it a natural part of the product browsing experience.

### 3. Custom CMS and Admin Dashboard

Role-based access control with granular permissions per section and action. An approval workflow engine that holds changes in pending until an authorised approver acts — product pricing, content updates, B2B counters, and order cancellations can all require approval before taking effect. Super Admin accounts are invisible to non-super-admin roles. Every action is recorded in a tamper-proof audit log.

### 4. Email and Notification System

Email is a notification layer, not a process gate. Every business process completes regardless of whether email sends. If SMTP is not configured or email fails, the system creates an in-app notification for the super admin and continues normally. SMTP credentials are encrypted at rest in the database using AES-256-CBC — admins configure email from the dashboard without touching server environment variables.

### 5. ERP Sync Layer

A bi-directional sync contract between the dashboard and an existing Laravel ERP system. The dashboard side is fully built — Bull queue with exponential backoff, HMAC-SHA256 signed webhooks, graceful degradation when the ERP is not connected. The ERP module specification (Front Sync) is documented and ready to build. The dashboard works completely independently until the ERP module is installed — no code changes required to connect them.

### 6. Role-aware Help System

An in-dashboard manual that shows each staff member only the sections relevant to their role. Super admin sections are hidden from non-super-admin users. Includes a search function and scroll-tracking sidebar. Built as a client handoff tool — reduces dependence on developer support for routine questions.

---

## Engineering decisions worth noting

These are the decisions that show senior engineering judgement:

### Email as a notification layer

Early in the project the decision was made that email failure must never block a customer transaction. This sounds obvious but has non-obvious implementation consequences: every email call uses a fire-and-forget pattern (`void`, never awaited in the response path), the sender function wraps every step in try/catch and always returns a result (never throws), and failures create in-app notifications rather than surfacing errors to the user. An investigation audit later found one place where this pattern was violated (a blocking await on password reset) — it was fixed in a targeted patch.

### Graceful ERP degradation

The ERP was not available during platform development. Rather than blocking the build, every ERP call was written to degrade gracefully — if `ERP_BASE_URL` is not set, the function logs a warning and returns a safe empty default. The dashboard is fully functional without the ERP connected. This pattern allowed parallel development of both systems and means the production dashboard can be deployed before the ERP module is ready.

### Investigation before fixes

A recurring pattern throughout this build: before fixing any non-trivial bug, an investigation prompt was run first to understand the actual cause. This prevented multiple incorrect fixes — notably the invite token issue (where the fix would have been wrong without understanding that `@supabase/ssr` uses PKCE flow which does not process hash fragment tokens automatically) and the email notification audit (which revealed 10 specific gaps rather than implementing speculative fixes).

### Approval workflow engine

Rather than hardcoding which actions require approval, the approval workflow engine is configurable at runtime from the admin dashboard. Any action type can be protected, any role can be the approver, and the workflow can require changes to be held in draft until approved. The engine includes a fallback: if an approver role has no members, super admins receive an in-app alert rather than the approval request silently disappearing.

### Super admin visibility rules

Super admin accounts are not visible to non-super-admin users — not in the users list, not in role assignment dropdowns, not in any admin interface. The Super Admin role cannot be assigned via the UI even by super admins (prevents accidental escalation). This is a deliberate security architecture decision, not a default framework behaviour.

### Source of truth contracts

The ERP sync layer defines explicit source of truth rules: stock levels are ERP-owned (dashboard reads only), product pricing is dashboard-owned (flows to ERP after approval), order status uses last-write-wins within a 5-second conflict window. These rules are documented in the Front Sync specification and enforced in the inbound webhook handler.

---

## AI-native development

This project was built using an AI-native workflow. That term needs clarification because it is often misunderstood.

AI-native does not mean AI-generated. It means using AI as a senior pair programmer — one that needs precise direction, pushes back on vague requirements, and produces work that the human must review, question, and sometimes reject.

### How AI tools were orchestrated

**Claude (Anthropic)** — architecture, system design, specification writing, complex problem decomposition, investigation analysis, and this README. Used for the thinking work: what to build, why, and in what order.

**Cursor + Claude Code** — implementation. Every prompt was a precise specification, not a vague request. Cursor does not know the business context — that was maintained in a `CLAUDE.md` file at the project root that every session began by reading.

**GitHub Copilot** — inline completion during implementation sessions.

**Gemini** — asset generation for the Colour Lab visualiser.

### What AI cannot do (and didn't do here)

AI tools did not make product decisions. The B2B negotiation system, the Colour Lab UX entry point, the "email as notification layer" principle, the investigation-before-fix discipline — these came from engineering and product judgement, not from prompting.

Several times during this build the AI produced a fix before fully understanding the problem. Each time, the correct response was an investigation prompt first — asking the AI to report findings before touching code. This discipline is the difference between AI-assisted debugging and AI-accelerated technical debt.

The AI also missed things that required human review: the `/admin/users` endpoint showing customers mixed with staff, the invite email conflict between Supabase and custom SMTP, and the visual trust signals layout issue. These were caught by reviewing the output, not by trusting it.

### The result

A codebase that a senior developer wrote using AI tools — not an AI-generated codebase that a developer reviewed. The distinction shows in the consistency of patterns, the explicit architectural decisions, and the absence of the speculative fixes and duplicated logic that characterise AI-generated-and-merged codebases.

---

## Tech stack

| Layer      | Technology                         | Decision rationale |
|-----------|------------------------------------|-------------------|
| Framework | Next.js 14 App Router              | Server components for performance, file-based routing, Vercel deployment |
| Language  | TypeScript strict mode             | Catches integration errors at compile time across a large codebase |
| Database  | Supabase (PostgreSQL)              | RLS for row-level security, realtime for notifications, Auth built-in |
| Styling   | Tailwind CSS                       | Utility-first keeps design consistent without a component library overhead |
| Payments  | Paystack (NGN) + Stripe (USD/GBP) | Paystack is the dominant Nigerian gateway; Stripe for international |
| Queue     | Bull + Redis                       | Reliable retry with exponential backoff for ERP webhook delivery |
| Email     | Nodemailer SMTP                    | Provider-agnostic; works with any SMTP service; credentials in DB not env |
| Security  | reCAPTCHA v3 + HMAC-SHA256        | Invisible bot protection on public forms; signed webhooks for ERP |
| Fonts     | Inter + Fraunces                   | Inter for UI clarity; Fraunces for brand impact moments |

---

## Project structure

```
src/
  app/
    (public)/          Public site — 10+ pages
    (admin)/admin/     Admin dashboard — 20+ sections
    api/               API routes — 60+ endpoints
  components/
    ui/                Design system primitives
    public/            Public site components
    admin/             Admin components
  lib/
    supabase/          Database client + queries
    erp/               ERP sync layer (queue, client, webhook)
    email/             Email system (sender, templates, config)
    payments/          Paystack + Stripe integration
    auth/              RBAC + permissions
    notifications/     In-app notification system
    recaptcha/         reCAPTCHA v3 verification
  types/               TypeScript types
  styles/              Global CSS + design tokens
docs/                  Specification documents (see table below)
supabase/migrations/   Database migrations (ordered SQL)
```

---

## Key numbers

- 282 files committed in initial release
- 60+ API endpoints
- 20+ admin sections
- 10 database migrations
- 6 specification documents written before coding began
- 3 payment currencies (NGN, USD, GBP)
- 2 payment providers
- 1 ERP sync contract (dashboard side complete)

---

## Getting started

### Prerequisites

- Node.js 18+
- Supabase project
- Git

### Installation

```bash
git clone https://github.com/Nathan-Trent/chromax.git
cd chromax
npm install
cp .env.example .env.local
# Fill in your values
```

### Database setup

Run migrations **in order** in the Supabase SQL Editor:

```
supabase/migrations/000_utility_functions.sql
supabase/migrations/001_create_tables.sql
supabase/migrations/002_seed_roles.sql
supabase/migrations/003_requires_colour_selection.sql
supabase/migrations/004_settings.sql
supabase/migrations/005_auth_notifications.sql
supabase/migrations/006_homepage_featured_and_cms_seed.sql
supabase/migrations/007_homepage_hero_trust_fields.sql
supabase/migrations/008_customer_management.sql
supabase/migrations/009_audit_log_source_stripe.sql
```

### Development

```bash
npm run dev
# Site: http://localhost:3000
# Admin: http://localhost:3000/admin/dashboard
# Login: http://localhost:3000/login
```

---

## Environment variables

See `.env.example` for the complete list. Key variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=

# Payments
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
STRIPE_PUBLIC_KEY=

# Email encryption (one key for all SMTP passwords)
SETTINGS_ENCRYPTION_KEY=

# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# ERP sync (set after Front Sync module is built)
ERP_BASE_URL=
ERP_API_TOKEN=
WEBHOOK_SECRET=
```

---

## Documentation

Specifications live in `/docs`. The table below lists the canonical specification titles; filenames in-repo are shown afterward.

| Document | Contents |
|----------|----------|
| Chromax_Master_Brief | Project overview, goals, constraints |
| Chromax_Frontend_Design_Spec | Design system, component patterns |
| Chromax_Admin_System_Spec | RBAC, approval workflows, admin UX |
| Chromax_Operations_Dashboard_Spec | KPIs, ERP sync status, audit log |
| Chromax_ERP_Sync_Spec | Sync contract, event types, conflict rules |
| Chromax_FrontSync_AILayer_Spec | Laravel Front Sync module build reference |

**In this repository:** `chromax-data-models.md`, `chromax-api-routes.md`, `front-sync-spec.md`, `chromax-build-log.md`, `chromax_colour_lab.html`, `AI_Business_Assistant_Spec.html`.

---

## Deployment

Deployed on Vercel. Connected to GitHub for automatic deployment on push to `main`.

```bash
git push origin main
# Vercel deploys automatically
```

Manual deployment:

```bash
vercel --prod
```

---

## Built by

**Nathan Trent** — Full-stack developer, Lagos, Nigeria.

Available for projects involving complex system design, full-stack web platforms, ERP integrations, and AI-native development workflows.

[GitHub](https://github.com/Nathan-Trent)
