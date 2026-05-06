export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function wrapBody(inner: string): string {
  const logoSrc = `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")}/images/chromax-logo.png`;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#555555;line-height:1.7;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E8;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(26,26,46,0.08);">
<tr><td style="background:#1a1a2e;padding:20px 24px;text-align:center;">
<img src="${logoSrc}" alt="Chromax-MCR" width="48" height="48" style="display:block;margin:0 auto 8px auto;" />
<span style="font-size:15px;font-weight:600;letter-spacing:0.04em;color:#ffffff;">CHROMAX-MCR</span>
</td></tr>
<tr><td style="height:4px;background:#E8A020;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 24px;background:#F5F0E8;">
${inner}
</td></tr>
<tr><td style="padding:16px 24px;background:#1a1a2e;text-align:center;">
<p style="margin:0;font-size:11px;color:rgba(255,255,255,0.55);line-height:1.6;">© ${year} Chromax-MCR · Ikotun, Lagos, Nigeria · <a href="mailto:info@chromax-mcr.com" style="color:#E8A020;text-decoration:none;">info@chromax-mcr.com</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function orderConfirmation(data: {
  customerName: string;
  orderReference: string;
  items: { name: string; qty: number; unitPrice: number; currency: string }[];
  total: number;
  currency: string;
  shippingAddress: string;
}): EmailTemplate {
  const rows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #E8E8E4;font-size:14px;">${escapeHtml(i.name)}</td><td style="padding:8px;border-bottom:1px solid #E8E8E4;text-align:center;font-size:14px;">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #E8E8E4;text-align:right;font-size:14px;">${money(i.unitPrice, i.currency)}</td></tr>`,
    )
    .join("");
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">Order confirmed</h1>
<p style="margin:0 0 20px;font-size:15px;">Hi ${escapeHtml(data.customerName)}, thanks for your order. Your reference is <strong style="font-family:monospace;color:#1a1a2e;">${escapeHtml(data.orderReference)}</strong>.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;padding:0;overflow:hidden;margin-bottom:20px;">
<tr style="background:#F0EAD6;"><th align="left" style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#633806;">Item</th><th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#633806;">Qty</th><th align="right" style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#633806;">Price</th></tr>
${rows}
<tr><td colspan="2" style="padding:12px;font-weight:600;font-size:14px;color:#1a1a2e;">Total</td><td align="right" style="padding:12px;font-weight:600;font-size:14px;color:#1a1a2e;">${money(data.total, data.currency)}</td></tr>
</table>
<p style="margin:0 0 8px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1.2px;color:#633806;">Shipping address</p>
<p style="margin:0;font-size:14px;white-space:pre-wrap;">${escapeHtml(data.shippingAddress)}</p>`;
  return {
    subject: `Order confirmed — ${data.orderReference}`,
    html: wrapBody(inner),
    text: `Order confirmed — ${data.orderReference}\n\nHi ${data.customerName},\n\nTotal: ${money(data.total, data.currency)}\n\n${data.shippingAddress}`,
  };
}

export function orderStatusUpdate(data: {
  customerName: string;
  orderReference: string;
  newStatus: string;
  trackingNumber?: string;
  courier?: string;
}): EmailTemplate {
  const track =
    data.trackingNumber != null && String(data.trackingNumber).trim()
      ? `<p style="margin:16px 0 0;font-size:14px;">Tracking (${escapeHtml(data.courier ?? "Carrier")}): <strong>${escapeHtml(String(data.trackingNumber))}</strong></p>`
      : "";
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">Order update</h1>
<p style="margin:0;font-size:15px;">Hi ${escapeHtml(data.customerName)}, your order <strong style="font-family:monospace;">${escapeHtml(data.orderReference)}</strong> is now <strong style="text-transform:capitalize;">${escapeHtml(data.newStatus)}</strong>.</p>
${track}`;
  let text = `Your order ${data.orderReference} has been updated to ${data.newStatus}.`;
  if (data.trackingNumber) text += `\nTracking: ${data.trackingNumber}`;
  return {
    subject: `Your order ${data.orderReference} has been updated`,
    html: wrapBody(inner),
    text,
  };
}

export function b2bOfferReceived(data: {
  buyerName: string;
  buyerCompany: string;
  productName: string;
  quantity: number;
  offeredPrice: number;
  currency: string;
  reference: string;
  adminUrl: string;
}): EmailTemplate {
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">New B2B offer</h1>
<p style="margin:0 0 16px;font-size:15px;"><strong>${escapeHtml(data.reference)}</strong> — ${escapeHtml(data.buyerName)} (${escapeHtml(data.buyerCompany)}) offered ${money(data.offeredPrice, data.currency)} for ${data.quantity}× ${escapeHtml(data.productName)}.</p>
<p style="margin:0;"><a href="${escapeHtml(data.adminUrl)}" style="display:inline-block;padding:12px 22px;background:#E8A020;color:#1a1a2e;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Open in admin</a></p>`;
  return {
    subject: `New B2B offer — ${data.reference}`,
    html: wrapBody(inner),
    text: `New B2B offer ${data.reference}: ${data.buyerName} / ${data.buyerCompany}. ${data.quantity}x ${data.productName} at ${money(data.offeredPrice, data.currency)}. ${data.adminUrl}`,
  };
}

export function b2bOfferResponse(data: {
  buyerName: string;
  action: "accepted" | "countered" | "declined";
  productName: string;
  reference: string;
  counterPrice?: number;
  message?: string;
  currency: string;
}): EmailTemplate {
  const subj =
    data.action === "accepted"
      ? `Your offer has been accepted — ${data.reference}`
      : data.action === "countered"
        ? `Counter-offer from Chromax — ${data.reference}`
        : `Regarding your offer — ${data.reference}`;
  const msg = data.message?.trim()
    ? `<p style="margin:16px 0 0;font-size:14px;">${escapeHtml(data.message)}</p>`
    : "";
  const counter =
    data.action === "countered" && data.counterPrice != null
      ? `<p style="margin:12px 0 0;font-size:15px;">Counter-offer: <strong>${money(Number(data.counterPrice), data.currency)}</strong></p>`
      : "";
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">Hello ${escapeHtml(data.buyerName)}</h1>
<p style="margin:0;font-size:15px;text-transform:capitalize;">Your offer for <strong>${escapeHtml(data.productName)}</strong> (${escapeHtml(data.reference)}) was <strong>${escapeHtml(data.action)}</strong>.</p>
${counter}${msg}`;
  return {
    subject: subj,
    html: wrapBody(inner),
    text: `${subj}\n\n${data.productName}. ${data.message ?? ""}`,
  };
}

export function approvalRequested(data: {
  approverName: string;
  actionType: string;
  recordLabel: string;
  submittedBy: string;
  dashboardUrl: string;
}): EmailTemplate {
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">Approval required</h1>
<p style="margin:0 0 8px;font-size:15px;">Hi ${escapeHtml(data.approverName)},</p>
<p style="margin:0 0 16px;font-size:15px;"><strong>${escapeHtml(data.actionType)}</strong> on <strong>${escapeHtml(data.recordLabel)}</strong> — submitted by ${escapeHtml(data.submittedBy)}.</p>
<p style="margin:0;"><a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:#E8A020;color:#1a1a2e;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Review in dashboard</a></p>`;
  return {
    subject: `Approval required: ${data.actionType}`,
    html: wrapBody(inner),
    text: `Approval required: ${data.actionType} — ${data.recordLabel}. Submitted by ${data.submittedBy}. ${data.dashboardUrl}`,
  };
}

export function approvalActioned(data: {
  submitterName: string;
  actionType: string;
  recordLabel: string;
  status: "approved" | "rejected";
  comment?: string;
}): EmailTemplate {
  const statusLabel = data.status === "approved" ? "approved" : "rejected";
  const c = data.comment?.trim()
    ? `<p style="margin:12px 0 0;font-size:14px;"><strong>Note:</strong> ${escapeHtml(data.comment)}</p>`
    : "";
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">Hi ${escapeHtml(data.submitterName)}</h1>
<p style="margin:0;font-size:15px;">Your change for <strong>${escapeHtml(data.recordLabel)}</strong> (<strong>${escapeHtml(data.actionType)}</strong>) has been <strong>${statusLabel}</strong>.</p>
${c}`;
  return {
    subject: `Your change has been ${statusLabel}`,
    html: wrapBody(inner),
    text: `Your change (${data.actionType} on ${data.recordLabel}) has been ${statusLabel}. ${data.comment ?? ""}`,
  };
}

export function welcomeEmail(data: { customerName: string }): EmailTemplate {
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">Welcome to Chromax-MCR</h1>
<p style="margin:0;font-size:15px;">Hi ${escapeHtml(data.customerName)}, we are glad you joined. Browse our catalogue for industrial, marine, and architectural coatings — and use the Colour Lab to preview shades.</p>`;
  return {
    subject: "Welcome to Chromax-MCR",
    html: wrapBody(inner),
    text: `Welcome ${data.customerName}! Thanks for creating an account at Chromax-MCR.`,
  };
}

export function passwordReset(data: { resetUrl: string }): EmailTemplate {
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">Reset your password</h1>
<p style="margin:0 0 16px;font-size:15px;">We received a request to reset your Chromax-MCR password.</p>
<p style="margin:0;"><a href="${escapeHtml(data.resetUrl)}" style="display:inline-block;padding:12px 22px;background:#E8A020;color:#1a1a2e;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Set a new password</a></p>
<p style="margin:20px 0 0;font-size:13px;color:#888;">If you did not request this, you can ignore this email.</p>`;
  return {
    subject: "Reset your Chromax-MCR password",
    html: wrapBody(inner),
    text: `Reset your password: ${data.resetUrl}`,
  };
}

export function staffInvite(data: {
  inviterName: string;
  inviterEmail: string;
  roleName: string;
  acceptUrl: string;
  expiresIn: string;
}): EmailTemplate {
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">You've been invited</h1>
<p style="margin:0 0 16px;font-size:15px;"><strong>${escapeHtml(data.inviterName)}</strong> has invited you to join the Chromax-MCR admin dashboard as <strong>${escapeHtml(data.roleName)}</strong>.</p>
<p style="margin:0 0 12px;"><a href="${escapeHtml(data.acceptUrl)}" style="display:inline-block;padding:14px 26px;background:#E8A020;color:#1a1a2e;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Accept invitation and set password</a></p>
<p style="margin:0;font-size:13px;color:#555;">This invitation expires in ${escapeHtml(data.expiresIn)}.</p>
<p style="margin:16px 0 0;font-size:12px;color:#888;">If you didn't expect this invitation, you can safely ignore this email.</p>`;
  return {
    subject: "You've been invited to Chromax-MCR Admin",
    html: wrapBody(inner),
    text: `${data.inviterName} invited you as ${data.roleName}. Accept: ${data.acceptUrl} (expires ${data.expiresIn}).`,
  };
}

/** Simple internal / test sends (no marketing wrapper headline). */
export function smtpSelfTest(): EmailTemplate {
  const inner = `<p style="margin:0;font-size:15px;">This is a test email from your Chromax-MCR admin dashboard. If you received this, your email configuration is working correctly.</p>`;
  return {
    subject: "Chromax-MCR email test",
    html: wrapBody(inner),
    text: "This is a test email from your Chromax-MCR admin dashboard. If you received this, your email configuration is working correctly.",
  };
}

export function erpSyncPendingReview(data: {
  userName: string;
  eventType: string;
  fieldChanged: string;
  productName: string;
  currentValue: unknown;
  incomingValue: unknown;
  dashboardUrl: string;
}): EmailTemplate {
  const summarize = (v: unknown): string => {
    if (v == null) return "—";
    if (typeof v === "object") {
      return escapeHtml(
        Object.entries(v as Record<string, unknown>)
          .map(([k, val]) => {
            const disp =
              val !== null && typeof val === "object" ? JSON.stringify(val) : String(val);
            return `${k}: ${disp}`;
          })
          .join(" · "),
      );
    }
    return escapeHtml(String(v));
  };
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">ERP sync review required</h1>
<p style="margin:0 0 12px;font-size:15px;">Hi ${escapeHtml(data.userName)},</p>
<p style="margin:0 0 16px;font-size:15px;">A <strong style="font-family:monospace;font-size:13px;">${escapeHtml(data.eventType)}</strong> change needs your approval for <strong>${escapeHtml(data.productName)}</strong> (${escapeHtml(data.fieldChanged)}).</p>
<table role="presentation" width="100%" style="background:#ffffff;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
<tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;color:#633806;">Current</td></tr>
<tr><td style="font-size:14px;color:#555555;padding-bottom:8px;">${summarize(data.currentValue)}</td></tr>
<tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.1px;color:#BA7517;">Incoming</td></tr>
<tr><td style="font-size:14px;color:#633806;">${summarize(data.incomingValue)}</td></tr>
</table>
<p style="margin:0;"><a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:#E8A020;color:#1a1a2e;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Review now</a></p>`;
  return {
    subject: `ERP sync review required — ${data.eventType}`,
    html: wrapBody(inner),
    text: `ERP sync review required — ${data.eventType}. Current: ${String(data.currentValue)}. Incoming: ${String(data.incomingValue)}. ${data.dashboardUrl}`,
  };
}

export function erpSyncAutoApplied(data: {
  userName: string;
  eventType: string;
  fieldChanged: string;
  productName: string;
  currentValue: unknown;
  incomingValue: unknown;
  undoWindowHours: number;
  dashboardUrl: string;
}): EmailTemplate {
  const summarize = (v: unknown): string => {
    if (v == null) return "—";
    if (typeof v === "object") {
      return escapeHtml(JSON.stringify(v));
    }
    return escapeHtml(String(v));
  };
  const hours = data.undoWindowHours;
  const undoNote =
    hours > 0
      ? `You can undo this in the ERP Sync screen within <strong>${hours}</strong> hours.`
      : `This change cannot be undone from the dashboard (undo window is 0 hours).`;
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">ERP sync auto-applied</h1>
<p style="margin:0 0 12px;font-size:15px;">Hi ${escapeHtml(data.userName)},</p>
<p style="margin:0 0 16px;font-size:15px;">A <strong style="font-family:monospace;font-size:13px;">${escapeHtml(data.eventType)}</strong> event was applied automatically for <strong>${escapeHtml(data.productName)}</strong> (${escapeHtml(data.fieldChanged)}).</p>
<p style="margin:0 0 8px;font-size:13px;color:#555;">Before: ${summarize(data.currentValue)}</p>
<p style="margin:0 0 16px;font-size:13px;color:#633806;">After: ${summarize(data.incomingValue)}</p>
<p style="margin:0 0 16px;font-size:14px;">${undoNote}</p>
<p style="margin:0;"><a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:#E8A020;color:#1a1a2e;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Open ERP Sync</a></p>`;
  return {
    subject: `ERP sync auto-applied — ${data.eventType}`,
    html: wrapBody(inner),
    text: `ERP sync auto-applied — ${data.eventType}. ${data.dashboardUrl}`,
  };
}

export function erpSyncActioned(data: {
  userName: string;
  action: "approved" | "rejected";
  eventType: string;
  fieldChanged: string;
  actorEmail: string;
  productName: string;
  note: string;
  dashboardUrl: string;
}): EmailTemplate {
  const label = data.action === "approved" ? "approved" : "rejected";
  const note = data.note?.trim()
    ? `<p style="margin:12px 0 0;font-size:14px;"><strong>Note:</strong> ${escapeHtml(data.note)}</p>`
    : "";
  const inner = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;color:#1a1a2e;">ERP sync ${label}</h1>
<p style="margin:0 0 12px;font-size:15px;">Hi ${escapeHtml(data.userName)},</p>
<p style="margin:0 0 16px;font-size:15px;"><strong>${escapeHtml(data.actorEmail)}</strong> ${escapeHtml(label)} a <strong style="font-family:monospace;font-size:13px;">${escapeHtml(data.eventType)}</strong> sync (${escapeHtml(data.fieldChanged)}) for <strong>${escapeHtml(data.productName)}</strong>.</p>
${note}
<p style="margin:16px 0 0;"><a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:#E8A020;color:#1a1a2e;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Open ERP Sync</a></p>`;
  return {
    subject: `ERP sync ${label} — ${data.eventType}`,
    html: wrapBody(inner),
    text: `ERP sync ${label}: ${data.eventType} / ${data.fieldChanged}. Actor: ${data.actorEmail}. ${data.dashboardUrl}`,
  };
}

/** Templates receive loose `data` from the mailer; each function narrows internally. */
export const EMAIL_TEMPLATES = {
  order_confirmation: orderConfirmation,
  order_status_update: orderStatusUpdate,
  b2b_offer_received: b2bOfferReceived,
  b2b_offer_response: b2bOfferResponse,
  approval_requested: approvalRequested,
  approval_actioned: approvalActioned,
  erp_sync_pending_review: (d: Record<string, unknown>) =>
    erpSyncPendingReview({
      userName: String(d.userName ?? ""),
      eventType: String(d.eventType ?? ""),
      fieldChanged: String(d.fieldChanged ?? ""),
      productName: String(d.productName ?? ""),
      currentValue: d.currentValue,
      incomingValue: d.incomingValue,
      dashboardUrl: String(d.dashboardUrl ?? ""),
    }),
  erp_sync_auto_applied: (d: Record<string, unknown>) =>
    erpSyncAutoApplied({
      userName: String(d.userName ?? ""),
      eventType: String(d.eventType ?? ""),
      fieldChanged: String(d.fieldChanged ?? ""),
      productName: String(d.productName ?? ""),
      currentValue: d.currentValue,
      incomingValue: d.incomingValue,
      undoWindowHours: typeof d.undoWindowHours === "number" ? d.undoWindowHours : 0,
      dashboardUrl: String(d.dashboardUrl ?? ""),
    }),
  erp_sync_actioned: (d: Record<string, unknown>) =>
    erpSyncActioned({
      userName: String(d.userName ?? ""),
      action: d.action === "rejected" ? "rejected" : "approved",
      eventType: String(d.eventType ?? ""),
      fieldChanged: String(d.fieldChanged ?? ""),
      actorEmail: String(d.actorEmail ?? ""),
      productName: String(d.productName ?? ""),
      note: String(d.note ?? ""),
      dashboardUrl: String(d.dashboardUrl ?? ""),
    }),
  welcome: welcomeEmail,
  password_reset: passwordReset,
  staff_invite: staffInvite,
  smtp_self_test: () => smtpSelfTest(),
} as unknown as Record<string, (data: Record<string, unknown>) => EmailTemplate>;
