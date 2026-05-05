# Front Sync — Laravel ERP integration specification

This document defines the contract between the **Chromax Next.js dashboard** (Supabase, Node/Bull) and the **Front Sync** module that will run inside the existing **Laravel ERP**. The WooCommerce bridge in the legacy ERP is **not** extended; Front Sync is a **new** surface that mirrors the Chromax event envelope and REST shapes below.

## Environment variables

### Dashboard (`chromax` — `.env.local`)

| Variable | Purpose |
|----------|---------|
| `ERP_BASE_URL` | Origin of the Laravel app (e.g. `https://erp.example.com`). No trailing slash required. |
| `ERP_API_TOKEN` | Laravel **Sanctum** (or equivalent) Bearer token for server-to-server reads. |
| `WEBHOOK_SECRET` | Shared HMAC key; used to **sign** outbound webhooks and **verify** inbound ones. Format: `sha256=<lowercase hex>` over the raw JSON body. Header: `X-Chromax-Signature`. |
| `REDIS_URL` | Redis connection URL for Bull queue `erp-outbound`. If unset, outbound events are **skipped** (dev-friendly). |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for enqueue (creates `erp_sync_log` rows) and for the inbound `POST /api/webhook/erp` handler. |

### Laravel ERP (`.env`)

| Variable | Purpose |
|----------|---------|
| `CHROMAX_WEBHOOK_SECRET` | Same value as dashboard `WEBHOOK_SECRET`. |
| `CHROMAX_DASHBOARD_WEBHOOK_URL` | Full URL to the dashboard inbound webhook, e.g. `https://dashboard.example.com/api/webhook/erp`. |
| Sanctum/API token | Issued for the dashboard; stored as `ERP_API_TOKEN` on the Chromax side. |

---

## REST endpoints (ERP implements; dashboard calls)

Base path: `{ERP_BASE_URL}/api/chromax`.

All requests from the dashboard use:

`Authorization: Bearer {ERP_API_TOKEN}`  
`Content-Type: application/json` (where a body is sent)

### `GET /api/chromax/health`

**Response (200):** JSON including at least `timestamp` (ISO 8601). May include other diagnostic keys; the dashboard treats HTTP 200 + parseable JSON as **connected**.

### `GET /api/chromax/products/{erpProductId}/stock`

Returns stock snapshot for a single ERP product id (maps to `products.erp_product_id` in Supabase).

Suggested shape:

```json
{
  "product_id": "string",
  "name": "string",
  "stock": 0,
  "low_threshold": 0,
  "unit": "string",
  "last_updated": "ISO-8601"
}
```

### `POST /api/chromax/products/stock/bulk`

**Body:** `{ "product_ids": ["…"] }`  
**Response:** Either `{ "quantities": { "erp-id": 12 } }` or a flat map of id → quantity (dashboard accepts both).

### `GET /api/chromax/orders`

**Query:** `email`, `status`, `page` (optional).  
**Response:** `{ "orders": [ … ], "total": number }` where each order aligns with `ERPOrder` in `src/lib/erp/client.ts`.

---

## Inbound webhook (ERP → dashboard)

**URL (on Chromax):** `POST {NEXT_PUBLIC_APP_URL}/api/webhook/erp`

**Headers:**

- `Content-Type: application/json`
- `X-Chromax-Signature`: `sha256=` + HMAC-SHA256 hex of the **raw** body using `WEBHOOK_SECRET`

**Behaviour:**

- Invalid signature → **401**.
- Valid signature → always **200** with `{ "received": true, "event_type": "<type>" }` after logging and best-effort processing (unknown event types are logged only).

### Envelope (both directions use the same shape)

```json
{
  "event_type": "order.status_updated",
  "source": "erp",
  "timestamp": "2026-05-04T12:00:00.000Z",
  "record_id": "record-key",
  "triggered_by": "user@example.com",
  "data": { }
}
```

### Handled `event_type` values from ERP

| `event_type` | Intended effect on Supabase |
|--------------|----------------------------|
| `stock.updated` | Update `products.stock` where `erp_product_id` = `data.product_id` (or `record_id`). |
| `stock.low_threshold` | Append audit-style alert (`audit_log` row) for super-admin visibility. |
| `order.status_updated` | Update `orders` where `erp_order_id` matches; write `audit_log` with `source: erp`. |
| `order.created` | Insert `orders` row if `erp_order_id` not present (`source: erp`). |
| `payment.confirmed` | Set `orders.payment_status` = `paid` where `erp_order_id` matches. |
| `product.updated` | Patch product by `erp_product_id` (name, slug, prices, stock, `low_threshold`). |

Payload fields may evolve; ERP should send stable ERP ids in `data` and use `record_id` when possible.

---

## Outbound webhook (dashboard → ERP)

**URL (on ERP):** `POST {ERP_BASE_URL}/api/chromax/webhook`

**Headers:** same HMAC scheme as inbound (`X-Chromax-Signature`).

**Delivery:** Bull queue `erp-outbound` (5 attempts, exponential backoff from 30s). Each job creates a `erp_sync_log` row with `direction = dashboard_to_erp` and `status = retrying` until success or **dead letter**.

### Event constants (dashboard)

Defined in `src/lib/erp/events.ts`, including:

- `order.status_updated`, `order.cancelled`
- `b2b_offer.accepted`, `b2b_offer.counter_sent`
- `product.price_updated`
- `lead.captured`, `quote.requested`
- Inbound-only names (`stock.updated`, etc.) are documented for ERP authors; the dashboard consumes them on `/api/webhook/erp`.

### When the dashboard emits events

| Trigger | Event |
|---------|--------|
| Order status PATCH (fulfilment) | `order.status_updated` |
| Cancellation approved | `order.cancelled` |
| B2B accept | `b2b_offer.accepted` |
| B2B counter sent (after approval if required) | `b2b_offer.counter_sent` |
| Product price applied (direct or after pending approval) | `product.price_updated` |
| AI lead POST | `lead.captured` |

Payloads include ids and references suitable for ERP idempotency (e.g. `order_id`, `reference`, `erp_order_id` when known).

---

## Operational notes

1. **Worker process:** Run `npm run erp-worker` (uses `tsx`) alongside the Next.js app whenever `REDIS_URL` is set and outbound sync is required.
2. **Idempotency:** ERP should dedupe by `record_id` + `event_type` + `timestamp` (or a future `idempotency_key` if added).
3. **Stock authority:** Per Chromax platform rules, **ERP remains source of truth for stock**; the dashboard applies `stock.updated` from ERP and does not push stock back unless product sync rules say otherwise (price push is separate).
4. **Security:** TLS verify should be **enabled** in production; the legacy WooCommerce client used `verify_ssl => false` — **do not** copy that for Front Sync.

---

## Versioning

- **v0.1** — May 2026 — Initial Front Sync spec aligned with dashboard implementation (`erp_sync_log`, Bull queue, `/api/webhook/erp`, admin ERP Sync UI).
