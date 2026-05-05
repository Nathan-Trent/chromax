# chromax-build-log.md
# Running log of what has been built, what is in progress, and what is next
# Update this file every time you complete a task or make a key decision
# This file is read by Cursor and Claude Code to understand current project state
# ALWAYS keep this up to date — it prevents AI tools from rebuilding things that exist

---

## Project status

**Started:** 2025
**Current phase:** Phase 1 complete (public + admin); ERP integration deferred to Front Sync phase
**Last updated:** 2026-05-05

---

## Phase 1 — Public site and admin CMS

**Status: [x] Complete** — Public storefront, Colour Lab, cart/checkout routes, full admin (products, swatches, CMS, blog, projects, certifications, orders, B2B, AI logs, users/roles, workflows, audit log, settings), design system, Supabase migrations, and **ERP Sync admin screen + dashboard-side sync layer** (see `docs/front-sync-spec.md`). Individual line items below are collapsed as done; do not regenerate.

- [x] Design system, layouts, core UI, public pages, admin shell, auth, permissions
- [x] Supabase tables, RLS, seed roles, ERP-related columns (`erp_product_id`, `erp_order_id`, `erp_sync_log`)
- [x] Admin ERP Sync page + `/api/admin/erp-sync/*` + inbound `/api/webhook/erp`
- [x] Bull queue (`erp-outbound`), `src/lib/erp/*`, worker script `npm run erp-worker`

### Homepage rebuild

**Status: [x] Complete**

Note: Homepage fully rebuilt with 10 sections, CMS-powered, animations, floating orbs, scroll reveals, counting stats. All text editable from `/admin/content/homepage`.

---

## Phase 2 — ERP sync layer

- [x] ERP queue setup — Bull + Redis (`src/lib/erp/queue.ts`, `queue-processor.ts`)
- [x] HMAC signing and verification (`src/lib/erp/webhook.ts`)
- [x] ERP REST API client (`src/lib/erp/client.ts`)
- [x] Outbound event wiring (orders, cancellations, B2B, pricing, leads)
- [x] Inbound webhook processor (`src/app/api/webhook/erp/route.ts` + `src/lib/erp/inbound.ts`)
- [ ] Conflict detection logic (timestamp / last-write rules — spec in CLAUDE.md, not yet coded)
- [x] ERP sync log and status monitoring (admin UI + `erp_sync_log`)

---

## Phase 3 — AI integration

- [ ] External AI widget embed (script tag in root layout)
- [ ] Internal AI assistant iframe embed in admin layout
- [ ] AI lead capture → Supabase `ai_leads` (API POST exists; widget integration pending)
- [ ] Lead management polish

---

## Key decisions log

| Date | Decision | Why |
|------|----------|-----|
| 2026-05-04 | ERP sync layer built on dashboard side, pointing at Front Sync endpoints (`/api/chromax/*`) | ERP module not yet present; dashboard must run without ERP (`ERP_BASE_URL` optional). |
| 2026-05-04 | Redis/Bull skipped gracefully when `REDIS_URL` unset | Local dev without Redis must not crash. |
| 2026-05-04 | WooCommerce Laravel module left untouched; new **Front Sync** module planned separately | Avoid coupling new Chromax contracts to legacy Woo REST. |
| 2026-05-04 | Outbound HMAC uses `sha256=<hex>` and header `X-Chromax-Signature` | Consistent, simple verification in Node and PHP. |

---

## PENDING — ERP integration (separate phase)

- Front Sync Laravel module (to be built after ERP investigation)
- Real Paystack + Stripe API calls (needs live keys)
- Colour Lab SVG realism (photo + mix-blend-mode)
- Customer account pages (order history)
- Deployment to Vercel
- AI system (separate Node.js project)

---

## Issues and blockers

| Status | Issue | Notes |
|--------|-------|-------|
| — | Colour Lab SVG realism | Replace drawings with photo + mix-blend-mode; needs source images. |

---

## Environment variables status

| Variable | Status |
|----------|--------|
| NEXT_PUBLIC_SUPABASE_URL | [ ] project-dependent |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | [ ] project-dependent |
| SUPABASE_SERVICE_ROLE_KEY | [ ] required for webhooks + queue logging |
| NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY | [ ] |
| PAYSTACK_SECRET_KEY | [ ] |
| STRIPE_PUBLIC_KEY | [ ] |
| STRIPE_SECRET_KEY | [ ] |
| STRIPE_WEBHOOK_SECRET | [ ] |
| ERP_BASE_URL | [ ] optional until Front Sync exists |
| ERP_API_TOKEN | [ ] |
| WEBHOOK_SECRET | [ ] |
| REDIS_URL | [ ] optional for dev |
| SENDGRID_API_KEY | [ ] |
| EMAIL_FROM | [ ] |
| AI_SYSTEM_CLIENT_ID | [ ] |
| AI_SYSTEM_URL | [ ] |
| NEXT_PUBLIC_APP_URL | [ ] |
| SUPER_ADMIN_ROLE_ID | [ ] |
| NEXT_PUBLIC_CURRENCY_DEFAULT | [ ] |

---

## How to use this file with Cursor

At the start of each coding session:
1. Open this file
2. Mark the thing you are working on as `[~]` (in progress)
3. When you complete something, mark it `[x]`
4. If you make a key decision, add it to the decisions log
5. If you hit a blocker, add it to the issues list

When prompting Cursor, start with:
"Read CLAUDE.md and chromax-build-log.md. I am working on [task]. Here is the current state: [paste relevant code]."

This prevents Cursor from regenerating things you've already built.
