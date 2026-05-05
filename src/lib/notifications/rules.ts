/**
 * Reference: in-app notifications surfaced to Super Admins (and staff) via
 * `notifySuperAdmins` / `createNotification`. Actual `notifySuperAdmins` calls
 * live in API routes and email helpers — this file documents intent only.
 *
 * | Type                    | Trigger (approx.)                                              |
 * |-------------------------|----------------------------------------------------------------|
 * | order_new               | Paystack (or other) webhook marks order paid / confirmed       |
 * | b2b_offer_new           | Public POST `/api/b2b/offers` after offer persisted             |
 * | approval_pending        | *(emailed via `sendApprovalRequested`)* — use for future UI     |
 * | approval_actioned       | *(emailed via `sendApprovalActioned`)* — use for future UI      |
 * | email_failed            | `sendEmail` catch — SMTP / transport errors                       |
 * | email_not_configured    | `sendEmail` when SMTP host/user/password incomplete              |
 * | erp_sync_failed         | *(planned ERP queue / inbound failures)*                          |
 * | stock_low               | *(planned inventory checks)*                                     |
 * | staff_invited           | Admin invite API after successful `inviteUserByEmail`            |
 */

export const NOTIFICATION_TYPES = {
  ORDER_NEW: "order_new",
  B2B_OFFER_NEW: "b2b_offer_new",
  APPROVAL_PENDING: "approval_pending",
  APPROVAL_ACTIONED: "approval_actioned",
  EMAIL_FAILED: "email_failed",
  EMAIL_NOT_CONFIGURED: "email_not_configured",
  ERP_SYNC_FAILED: "erp_sync_failed",
  STOCK_LOW: "stock_low",
  STAFF_INVITED: "staff_invited",
} as const;
