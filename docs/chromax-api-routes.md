# chromax-api-routes.md
# All Next.js App Router API routes for the Chromax-MCR platform
# Location: src/app/api/
# Read this before creating any route handler
# All routes return { data, error } shape — never 200 with error in body

---

## Conventions

```typescript
// Standard success response
return NextResponse.json({ data: result }, { status: 200 })

// Standard error response
return NextResponse.json({ error: 'Human-readable message' }, { status: 4xx|5xx })

// All mutations must:
// 1. Validate input with Zod
// 2. Check auth and role permissions
// 3. Apply the change
// 4. Write to audit_log
// 5. Fire ERP sync event if needed
// 6. Return { data }
```

---

## Authentication routes

### POST /api/auth/login
Sign in with email + password via Supabase Auth.
```typescript
// Body: { email: string, password: string }
// Returns: { data: { user, session } }
// Errors: 401 invalid credentials, 422 validation error
```

### POST /api/auth/logout
```typescript
// No body
// Returns: { data: { success: true } }
```

### POST /api/auth/register
Public customer registration.
```typescript
// Body: { email, password, full_name, phone?, preferred_currency? }
// Returns: { data: { user } }
// Also creates: customers record linked to auth user
```

### POST /api/auth/reset-password
```typescript
// Body: { email: string }
// Triggers Supabase password reset email
// Returns: { data: { sent: true } }
```

---

## Products — public routes

### GET /api/products
Fetch live products with optional filters.
```typescript
// Query params:
//   category?: 'industrial'|'marine'|'automotive'|'architectural'|'custom'
//   status?: defaults to 'live' for public, all statuses for admin
//   search?: string — searches name and description
//   page?: number (default 1)
//   limit?: number (default 24, max 100)
//   sort?: 'name_asc'|'name_desc'|'price_asc'|'price_desc'|'newest'
// Returns: { data: { products: Product[], total: number, page, limit } }
// Note: never returns min_b2b_price_* fields to public
```

### GET /api/products/[slug]
```typescript
// Returns: { data: Product }
// Includes: linked colour_swatches for this product's category
// Errors: 404 if not found or not live
// Note: never returns min_b2b_price_* fields to public
```

### GET /api/products/[slug]/stock
Live stock level for a product. Proxied from ERP.
```typescript
// Returns: { data: { stock: number, low_threshold: number, in_stock: boolean } }
// Fetches from ERP via GET /api/products/{erp_id}/stock
// Falls back to Supabase stock field if ERP unreachable
```

---

## Products — admin routes (authenticated + role check)

### POST /api/admin/products
Create new product draft.
```typescript
// Requires: products.create permission
// Body: Omit<Product, 'id'|'created_at'|'updated_at'>
// Triggers: pending_change if approval workflow exists for 'product.created'
// Returns: { data: { product_id, status: 'draft'|'pending_approval' } }
```

### PATCH /api/admin/products/[id]
Update a product. Pricing changes go through approval workflow.
```typescript
// Requires: products.edit permission
// Pricing fields (price_ngn, price_usd, price_gbp, bulk_tiers) require products.approve_pricing
// If price changed and no approve_pricing permission:
//   → creates pending_change record, notifies Chief Accountant
//   → returns { data: { pending: true, change_id } }
// If approved or non-pricing change:
//   → applies immediately, writes audit_log, fires ERP sync
//   → returns { data: { product } }
```

### DELETE /api/admin/products/[id]
Archive a product (soft delete — sets status to 'archived').
```typescript
// Requires: products.delete permission
// Never hard-deletes — sets status = 'archived'
// Returns: { data: { archived: true } }
```

---

## Colour swatches

### GET /api/swatches
```typescript
// Query params: category? (defaults to all active swatches)
// Returns: { data: ColourSwatch[] }
// Ordered by category, then display_order
// Public endpoint — used by Colour Lab
```

### GET /api/swatches/[category]
```typescript
// Returns: { data: ColourSwatch[] } for that category, active only
// Used by Colour Lab when switching tabs
```

### PATCH /api/admin/swatches/[id]
```typescript
// Requires: swatches.edit permission
// Body: { name?, hex?, product_code?, display_order?, active? }
// Validates hex format before saving
// No approval workflow — goes live immediately
// Writes audit_log
// Returns: { data: ColourSwatch }
```

### POST /api/admin/swatches
```typescript
// Requires: swatches.edit permission
// Body: { name, hex, product_code, category, product_id?, display_order? }
// Returns: { data: ColourSwatch }
```

### PATCH /api/admin/swatches/reorder
```typescript
// Requires: swatches.edit permission
// Body: { category: string, ordered_ids: string[] }
// Updates display_order for all swatches in category
// Returns: { data: { updated: number } }
```

---

## Orders — public routes

### POST /api/orders
Create an order after payment confirmation.
```typescript
// Called by Paystack/Stripe webhook handlers — not directly by frontend
// Body: full order payload from payment gateway
// Creates order with status 'confirmed' (payment already verified)
// Fires ERP sync event: order.created
// Returns: { data: { order_id, reference } }
```

### GET /api/orders/[reference]
Customer fetches their own order.
```typescript
// Requires: authenticated customer
// Checks: order.customer_id === auth.uid()
// Returns: { data: Order }
// Errors: 403 if not their order, 404 if not found
```

### GET /api/account/orders
Customer's full order history.
```typescript
// Requires: authenticated customer
// Query: page?, limit?
// Returns: { data: { orders: Order[], total } }
```

---

## Orders — admin routes

### GET /api/admin/orders
```typescript
// Requires: orders.view permission
// Query params:
//   status?: filter by status
//   currency?: NGN|USD|GBP
//   country?: string
//   search?: reference, customer name, or email
//   page?, limit?
//   sort?: 'newest'|'oldest'|'value_desc'|'value_asc'|'urgency'
// Returns: { data: { orders: Order[], total } }
```

### GET /api/admin/orders/[id]
```typescript
// Requires: orders.view permission
// Returns: { data: Order } with full detail including audit trail
```

### PATCH /api/admin/orders/[id]/status
Update order fulfilment status.
```typescript
// Requires: orders.fulfil permission
// Body: { status: 'confirmed'|'packed'|'dispatched'|'delivered', tracking_number?, courier? }
// Validates: can only advance forward (not go backwards) unless admin
// On success:
//   → updates order status
//   → sends customer email notification
//   → fires ERP sync event: order.status_updated with source: 'dashboard'
//   → writes audit_log with source: 'dashboard'
// Returns: { data: { order } }
```

### POST /api/admin/orders/[id]/cancel
Request order cancellation.
```typescript
// Requires: orders.cancel_request permission
// Creates pending_change → triggers Chief Accountant approval
// Returns: { data: { pending: true, change_id } }
```

---

## B2B offers

### POST /api/b2b/offers
Submit a new B2B offer from the public site.
```typescript
// Public endpoint — no auth required
// Body: { buyer_email, buyer_name, buyer_company?, buyer_country?,
//          buyer_phone?, product_id, quantity, offered_price, currency }
// Validates: offered_price is a positive number
// Does NOT check against min_price here — that's admin only
// Creates b2b_offer with status 'pending'
// Sends confirmation email to buyer
// Creates in-app notification for Sales Manager
// Returns: { data: { offer_id, reference } }
```

### GET /api/b2b/offers/[reference]
Buyer checks status of their offer.
```typescript
// No auth — uses reference + email for lookup
// Query: email (must match offer buyer_email)
// Returns: { data: { reference, status, thread (buyer messages only) } }
// NEVER returns: min_price, internal_notes, assigned_to
```

### GET /api/admin/b2b
```typescript
// Requires: b2b.view permission
// Query: status?, search?, currency?, page?, limit?
// Returns: { data: { offers: B2BOffer[], total } }
// Includes min_price for roles with b2b.respond permission
```

### GET /api/admin/b2b/[id]
```typescript
// Requires: b2b.view permission
// Returns: { data: B2BOffer } including min_price and internal_notes
```

### POST /api/admin/b2b/[id]/respond
Respond to a B2B offer.
```typescript
// Requires: b2b.respond permission
// Body: { action: 'accept'|'counter'|'decline', counter_price?, message? }
//
// action = 'accept':
//   → sets status to 'accepted', records accepted_at
//   → triggers payment link email to buyer
//   → fires ERP sync: b2b_offer.accepted
//
// action = 'counter':
//   → if counter_price >= min_price: can send directly (if b2b.respond)
//   → if requires approval: creates pending_change → Chief Accountant notified
//   → on approval: updates thread, sets status to 'countered', emails buyer
//   → fires ERP sync: b2b_offer.counter_sent
//
// action = 'decline':
//   → sets status to 'declined', emails buyer politely
//
// All actions: write audit_log
// Returns: { data: { status, pending? } }
```

---

## Cart and checkout

### POST /api/checkout/paystack/init
Initialise a Paystack payment.
```typescript
// Requires: authenticated customer (or guest with email)
// Body: { items: CartItem[], shipping_address, currency: 'NGN' }
// Creates: order with status 'new', payment_status 'pending'
// Calls: Paystack API to initialise transaction
// Returns: { data: { authorization_url, reference, order_id } }
// Frontend: redirects to authorization_url
```

### POST /api/checkout/stripe/init
Initialise a Stripe payment intent.
```typescript
// Requires: authenticated customer (or guest with email)
// Body: { items: CartItem[], shipping_address, currency: 'USD'|'GBP' }
// Creates: order with status 'new', payment_status 'pending'
// Calls: Stripe API to create payment intent
// Returns: { data: { client_secret, order_id } }
// Frontend: uses client_secret with Stripe Elements
```

---

## Webhook receivers

### POST /api/webhook/paystack
```typescript
// Called by Paystack on payment events
// Verifies: x-paystack-signature header (HMAC-SHA256)
// On 'charge.success':
//   → updates order payment_status to 'paid', status to 'confirmed'
//   → sends customer confirmation email
//   → fires ERP sync: order.created or order.payment_confirmed
// Returns: 200 immediately (Paystack requires fast response)
```

### POST /api/webhook/stripe
```typescript
// Called by Stripe on payment events
// Verifies: stripe-signature header using Stripe webhook secret
// On 'payment_intent.succeeded':
//   → same flow as Paystack success
// Returns: 200 immediately
```

### POST /api/webhook/erp
Receive inbound events from the Laravel ERP.
```typescript
// Verifies: x-chromax-signature header (HMAC-SHA256 with shared WEBHOOK_SECRET)
// Rejects with 401 if signature invalid
// Processes events:
//   order.status_updated → update order status in Supabase, write audit_log with source: 'erp'
//   stock.updated        → update product stock in Supabase
//   stock.low_threshold  → create in-app notification
//   product.updated      → update product fields in Supabase
//   payment.confirmed    → update payment_status
// Writes to erp_sync_log for every event
// Returns: { data: { received: true } }
```

---

## Content — admin routes

### GET /api/admin/content/[page_key]
```typescript
// Requires: content.view permission
// Returns: { data: ContentPage }
```

### PATCH /api/admin/content/[page_key]
```typescript
// Requires: content.edit permission
// Body: { content: jsonb, title? }
// Triggers: approval workflow 'content.page_updated' if configured
// If no workflow: goes live immediately
// Writes audit_log
// Returns: { data: { status: 'live'|'pending_approval' } }
```

### GET /api/admin/blog
### POST /api/admin/blog
### PATCH /api/admin/blog/[id]
### DELETE /api/admin/blog/[id]
```typescript
// Requires: blog.view / blog.create / blog.edit / blog.delete permissions
// Standard CRUD. Approval workflow applies to publishing (status: draft → live)
```

---

## Certifications — admin routes

### GET /api/admin/certifications
### POST /api/admin/certifications
### PATCH /api/admin/certifications/[id]
### DELETE /api/admin/certifications/[id]
```typescript
// Requires: certifications.view / certifications.edit permissions
// Standard CRUD
// Document upload handled via Supabase storage directly (client-side signed URL)
```

---

## Projects — admin routes

### GET /api/admin/projects
### POST /api/admin/projects
### PATCH /api/admin/projects/[id]
### DELETE /api/admin/projects/[id]
```typescript
// Requires: projects.view / projects.edit permissions
// Standard CRUD. Photo upload via Supabase storage.
```

---

## Approval workflows — admin routes

### GET /api/admin/workflows
```typescript
// Requires: workflows.view permission
// Returns all configured approval workflows
```

### PATCH /api/admin/workflows/[id]
```typescript
// Requires: workflows.edit permission
// Super admin only in practice (enforced via role permissions)
// Body: { approver_role_id?, notification_channels?, draft_until_approved? }
```

### GET /api/admin/pending
Pending changes awaiting approval.
```typescript
// Requires: authenticated admin
// Returns only pending changes where the user's role is the approver_role
// (or all if super admin)
```

### POST /api/admin/pending/[id]/approve
### POST /api/admin/pending/[id]/reject
```typescript
// Requires: the approval permission for this action type
// approve: applies the after_values, writes audit_log, fires ERP sync if needed
// reject: sets status to 'rejected', notifies submitter by email
// Body for reject: { comment: string }
```

---

## Audit log — admin routes

### GET /api/admin/audit-log
```typescript
// Requires: audit_log.view permission
// Query: user_id?, action_type?, section?, source?, start_date?, end_date?, page?, limit?
// Returns: { data: { logs: AuditLog[], total } }
```

---

## ERP sync status — admin routes

### GET /api/admin/erp-sync/health
```typescript
// Requires: erp_sync.view permission
// Calls: GET {ERP_BASE_URL}/api/sync/health
// Returns: { data: { status: 'ok'|'degraded'|'down', last_event_at, queue_depth } }
```

### GET /api/admin/erp-sync/log
```typescript
// Requires: erp_sync.view permission
// Query: status?, direction?, page?, limit?
// Returns: { data: { events: ERPSyncLog[], total } }
```

### POST /api/admin/erp-sync/retry/[id]
```typescript
// Requires: erp_sync.view permission
// Manually retries a failed sync event from dead-letter queue
// Returns: { data: { retrying: true } }
```

---

## AI chat — admin routes

### GET /api/admin/ai-leads
```typescript
// Requires: b2b.view or sales permission (as defined by role)
// Query: status?, page?, limit?
// Returns: { data: { leads: AILead[], total } }
```

### PATCH /api/admin/ai-leads/[id]
```typescript
// Update lead status: new → contacted → converted → lost
// Body: { status: string }
// Returns: { data: AILead }
```

### POST /api/admin/ai-leads/[id]/convert
Convert a lead to a B2B offer.
```typescript
// Creates a b2b_offer pre-filled with lead data
// Updates lead status to 'converted'
// Returns: { data: { offer_id, reference } }
```

---

## Users and roles — admin routes (super admin only)

### GET /api/admin/users
### POST /api/admin/users/invite
### PATCH /api/admin/users/[id]/roles
### GET /api/admin/roles
### POST /api/admin/roles
### PATCH /api/admin/roles/[id]
### DELETE /api/admin/roles/[id]
```typescript
// All require: users.view / users.edit / users.create permissions
// users.delete and roles.delete are super admin only
```

---

## Notes for Cursor / Claude Code

1. Every admin route must call `checkPermission(userId, section, action)` before doing anything.
   Implement this in `lib/auth/roles.ts` — fetches user's roles and checks the permissions jsonb.

2. Never return `min_b2b_price_*` fields to any endpoint that a buyer or public user can call.
   Create a `B2BOfferPublic` type that omits these fields for public-facing responses.

3. The `PATCH /api/admin/orders/[id]/status` endpoint must validate the status transition.
   Valid transitions: new→confirmed, confirmed→packed, packed→dispatched, dispatched→delivered.
   Reverse transitions are not allowed except by super admin.

4. All webhook endpoints must return 200 immediately — process the event asynchronously if needed.
   Never let slow processing cause a webhook timeout.

5. All routes that trigger ERP sync must use the Bull queue (`lib/erp/queue.ts`), never fire directly.

6. For file uploads (images, PDFs): generate a signed upload URL from Supabase storage client-side,
   upload directly from the browser, then save the resulting URL to the database.
   Never pipe file uploads through the Next.js server.
