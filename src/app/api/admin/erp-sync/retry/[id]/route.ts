import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import type { ERPEventType } from "@/lib/erp/events";
import { getErpQueue, type ERPQueueJob } from "@/lib/erp/queue";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

type PayloadShape = {
  outbound?: { data?: Record<string, unknown>; triggeredBy?: string };
};

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "view")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  if (!process.env.REDIS_URL) {
    return NextResponse.json(
      { error: "Redis is not configured; cannot retry outbound events in this environment" },
      { status: 503 },
    );
  }

  const queue = getErpQueue();
  if (!queue) {
    return NextResponse.json({ error: "ERP queue is not available" }, { status: 503 });
  }

  let service: ReturnType<typeof createServiceRoleClient>;
  try {
    service = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data: row, error: fetchErr } = await service
    .from("erp_sync_log")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const st = row.status as string;
  if (st !== "failed" && st !== "dead_letter") {
    return NextResponse.json({ error: "Only failed or dead-letter events can be retried" }, { status: 422 });
  }
  if (row.direction !== "dashboard_to_erp") {
    return NextResponse.json({ error: "Only outbound events can be retried" }, { status: 422 });
  }

  const payload = row.payload as PayloadShape | null;
  const outbound = payload?.outbound;
  const data =
    (outbound?.data && typeof outbound.data === "object" ? outbound.data : null) ??
    (typeof row.payload === "object" && row.payload !== null
      ? (row.payload as Record<string, unknown>)
      : {});
  const triggeredBy = outbound?.triggeredBy ?? ctx.user.email;
  const eventType = row.event_type as ERPEventType;
  const recordId = (row.record_id as string) ?? id;

  await service
    .from("erp_sync_log")
    .update({
      status: "retrying",
      attempt_count: 0,
      error_message: null,
    })
    .eq("id", id);

  const jobData: ERPQueueJob = {
    eventType,
    data: data as Record<string, unknown>,
    recordId,
    triggeredBy,
    syncLogId: id,
  };

  try {
    await queue.add(jobData, { jobId: `${id}-retry-${Date.now()}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Queue add failed";
    await service
      .from("erp_sync_log")
      .update({ status: "failed", error_message: msg })
      .eq("id", id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ data: { retrying: true } });
}
