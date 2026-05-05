import { buildWebhookPayload, signWebhookPayload } from "@/lib/erp/webhook";
import { createServiceRoleClient } from "@/lib/supabase/service";

import { type ERPQueueJob, getErpQueue } from "./queue";

const MAX_ATTEMPTS = 5;

export function registerErpQueueProcessor(): void {
  const queue = getErpQueue();
  if (!queue) {
    console.warn("[ERP queue processor] REDIS_URL missing — not registering worker");
    return;
  }

  void queue.process(async (job) => {
    const { eventType, data, recordId, triggeredBy, syncLogId } =
      job.data as ERPQueueJob;

    const base = process.env.ERP_BASE_URL?.replace(/\/$/, "");
    if (!base) {
      throw new Error("ERP_BASE_URL not configured");
    }

    const service = createServiceRoleClient();
    const payload = buildWebhookPayload(eventType, data, recordId, triggeredBy);
    const body = JSON.stringify(payload);
    const signature = signWebhookPayload(body);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    try {
      response = await fetch(`${base}/api/chromax/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chromax-Signature": signature,
        },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      if (syncLogId) {
        await service
          .from("erp_sync_log")
          .update({
            status: "retrying",
            error_message: `HTTP ${response.status}: ${text.slice(0, 500)}`,
            attempt_count: job.attemptsMade + 1,
          })
          .eq("id", syncLogId);
      }
      throw new Error(`ERP webhook failed: ${response.status}`);
    }

    if (syncLogId) {
      await service
        .from("erp_sync_log")
        .update({
          status: "success",
          resolved_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", syncLogId);
    }
  });

  queue.on("failed", async (job, err) => {
    const max = job.opts.attempts ?? MAX_ATTEMPTS;
    if (job.attemptsMade < max) {
      return;
    }
    const data = job.data as ERPQueueJob;
    if (!data.syncLogId) {
      return;
    }
    try {
      const service = createServiceRoleClient();
      await service
        .from("erp_sync_log")
        .update({
          status: "dead_letter",
          error_message: err?.message ?? "Unknown error",
        })
        .eq("id", data.syncLogId);
    } catch (e) {
      console.error("[ERP Queue] Dead letter update failed:", e);
    }
    console.error("[ERP Queue] Dead letter:", {
      eventType: data.eventType,
      recordId: data.recordId,
      error: err?.message,
    });
  });
}
