import { extractEnvelope } from "@/lib/erp/inbound";
import { processErpInboundSync } from "@/lib/erp/inbound-sync";
import { verifyWebhookSignature } from "@/lib/erp/webhook";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let service: ReturnType<typeof createServiceRoleClient>;
  try {
    service = createServiceRoleClient();
  } catch (e) {
    console.error("[webhook/erp] service role not configured:", e);
    return NextResponse.json({ received: false, error: "server_misconfigured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-chromax-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ received: false, error: "invalid_json", event_type: "" });
  }

  const env = extractEnvelope(body);
  const eventType = env?.event_type ?? "unknown";
  const recordId = env?.record_id ?? "";
  const data = env?.data ?? {};

  if (!env) {
    return NextResponse.json({ received: true, event_type: eventType });
  }

  const { data: logRow, error: logErr } = await service
    .from("erp_sync_log")
    .insert({
      event_type: eventType,
      direction: "erp_to_dashboard",
      source: "erp",
      record_id: recordId || null,
      payload: body as Record<string, unknown>,
      status: "success",
      attempt_count: 1,
    })
    .select("id")
    .maybeSingle();

  if (logErr) {
    console.error("[webhook/erp] erp_sync_log insert failed:", logErr.message);
  }

  const webhookLogId = logRow?.id as string | undefined;
  if (webhookLogId) {
    const drec = data as Record<string, unknown>;
    await processErpInboundSync({
      service,
      webhookLogId,
      eventType,
      recordId,
      data: drec,
    });
  }

  return NextResponse.json({ received: true, event_type: eventType });
}
