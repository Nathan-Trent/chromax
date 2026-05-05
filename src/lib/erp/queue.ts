import Bull from "bull";

import type { ERPEventType } from "@/lib/erp/events";
import { createServiceRoleClient } from "@/lib/supabase/service";

const QUEUE_NAME = "erp-outbound";

let queueInstance: Bull.Queue | null = null;

export function getErpQueue(): Bull.Queue | null {
  if (!process.env.REDIS_URL) {
    return null;
  }
  if (!queueInstance) {
    queueInstance = new Bull(QUEUE_NAME, {
      redis: process.env.REDIS_URL,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 30_000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  return queueInstance;
}

export interface ERPQueueJob {
  eventType: ERPEventType;
  data: Record<string, unknown>;
  recordId: string;
  triggeredBy: string;
  syncLogId?: string;
}

/**
 * Enqueue an outbound ERP event: creates `erp_sync_log` (retrying) then adds a Bull job.
 * No-ops with a console warning when `REDIS_URL` or service role key is missing.
 */
export async function queueERPEvent(
  eventType: ERPEventType,
  data: Record<string, unknown>,
  recordId: string,
  triggeredBy = "system",
): Promise<void> {
  if (!process.env.REDIS_URL) {
    console.warn("[ERP queue] REDIS_URL not set; skipping outbound event:", eventType);
    return;
  }

  let service: ReturnType<typeof createServiceRoleClient>;
  try {
    service = createServiceRoleClient();
  } catch {
    console.warn(
      "[ERP queue] SUPABASE_SERVICE_ROLE_KEY / URL not set; skipping outbound event:",
      eventType,
    );
    return;
  }

  const payload = {
    outbound: { data, triggeredBy },
  };

  const { data: row, error } = await service
    .from("erp_sync_log")
    .insert({
      event_type: eventType,
      direction: "dashboard_to_erp",
      source: "dashboard",
      record_id: recordId,
      payload,
      status: "retrying",
      attempt_count: 0,
    })
    .select("id")
    .maybeSingle();

  if (error || !row?.id) {
    console.error("[ERP queue] Failed to create erp_sync_log:", error?.message);
    return;
  }

  const queue = getErpQueue();
  if (!queue) {
    return;
  }

  try {
    await queue.add(
      {
        eventType,
        data,
        recordId,
        triggeredBy,
        syncLogId: row.id,
      } satisfies ERPQueueJob,
      { jobId: `${row.id}-${Date.now()}` },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "queue add failed";
    console.error("[ERP queue] add failed:", msg);
    await service
      .from("erp_sync_log")
      .update({
        status: "failed",
        error_message: msg,
      })
      .eq("id", row.id);
  }
}
