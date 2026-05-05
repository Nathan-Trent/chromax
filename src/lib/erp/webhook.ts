import crypto from "crypto";

import type { ERPEventType } from "@/lib/erp/events";

export interface WebhookPayload {
  event_type: ERPEventType | string;
  source: "dashboard" | "erp" | "ai" | "system";
  timestamp: string;
  record_id: string;
  triggered_by: string;
  data: Record<string, unknown>;
  signature?: string;
}

export function signWebhookPayload(body: string): string {
  const secret = process.env.WEBHOOK_SECRET ?? "";
  const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${hmac}`;
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null,
): boolean {
  if (!signature || !process.env.WEBHOOK_SECRET) {
    return false;
  }
  const expected = signWebhookPayload(body);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function buildWebhookPayload(
  eventType: ERPEventType,
  data: Record<string, unknown>,
  recordId: string,
  triggeredBy = "system",
): WebhookPayload {
  return {
    event_type: eventType,
    source: "dashboard",
    timestamp: new Date().toISOString(),
    record_id: recordId,
    triggered_by: triggeredBy,
    data,
  };
}
