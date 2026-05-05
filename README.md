# Chromax-MCR Platform

## Overview

Full-stack e-commerce and operations platform for Chromax-MCR, a premium paint manufacturer based in Lagos, Nigeria. Serving customers across Nigeria, UK, USA and Ukraine.

## What it includes

- Public e-commerce site (B2C retail + B2B wholesale)
- Interactive Colour Lab (paint visualiser)
- Custom CMS and admin dashboard
- Role-based access control (RBAC)
- Approval workflow engine
- Order management and fulfilment
- B2B price negotiation system
- Bi-directional ERP sync layer
- Email notification system
- Customer auth + staff invite flow
- In-app notification system
- reCAPTCHA v3 protection

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Paystack (NGN) + Stripe (USD/GBP) |
| Queue | Bull + Redis |
| Email | Nodemailer (SMTP) |
| Security | reCAPTCHA v3 + HMAC-SHA256 |

## Getting started

### Prerequisites

- Node.js 18+
- A Supabase project
- Git

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/chromax.git
cd chromax
npm install
```

### Environment setup

Copy the environment variables template and fill in your values:

```bash
cp .env.example .env.local
```

### Database setup

Run the migrations in order in Supabase SQL Editor:

```
supabase/migrations/000_utility_functions.sql
supabase/migrations/001_create_tables.sql
supabase/migrations/002_seed_roles.sql
supabase/migrations/004_settings.sql
supabase/migrations/005_auth_notifications.sql
```

### Development server

```bash
npm run dev
```

Open http://localhost:3000

Admin panel: http://localhost:3000/admin/dashboard  
Admin login: http://localhost:3000/login

## Project structure

```
src/
  app/
    (public)/          Public site pages
    (admin)/admin/     Admin dashboard pages
    api/               API route handlers
  components/
    ui/                Design system primitives
    public/            Public site components
    admin/             Admin components
  lib/
    supabase/          Database client + queries
    erp/               ERP sync layer
    email/             Email system
    payments/          Paystack + Stripe
    auth/              RBAC + permissions
    notifications/     In-app notifications
  types/               TypeScript types
  styles/              Global CSS + design tokens
docs/                  Specification documents
supabase/migrations/   Database migrations
```

## Key documentation

All specification documents are in /docs:

- chromax-master-brief — Project overview
- chromax-data-models — Database schema
- chromax-api-routes — API reference
- chromax-erp-sync-spec — ERP sync layer
- chromax-build-log — Build progress log
- Chromax_FrontSync_AILayer_Spec — ERP module spec

## Deployment

Deployed on Vercel. Push to main branch triggers automatic redeployment.

```bash
vercel --prod
```

## Environment variables

See `.env.example` for the complete list. Never commit `.env.local`.
