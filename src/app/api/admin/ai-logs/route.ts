import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { ERP_EVENTS } from "@/lib/erp/events";
import { queueERPEvent } from "@/lib/erp/queue";
import { adminAiLeadCreateSchema, adminAiLeadsQuerySchema } from "@/lib/schemas/admin-platform";
import type { AILeadRow } from "@/types/admin-workflows";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "ai_leads", "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const qp = {
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  };

  const parsed = adminAiLeadsQuerySchema.safeParse(qp);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { status, search } = parsed.data;
  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = ctx.supabase
    .from("ai_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  if (search?.trim()) {
    const safe = search.trim().replace(/[%*,]/g, "");
    const s = `%${safe}%`;
    q = q.or(`email.ilike.${s},company.ilike.${s}`);
  }

  const { data, error, count } = await q.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      leads: (data ?? []) as unknown as AILeadRow[],
      total: count ?? 0,
      page,
      limit,
    },
  });
}

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "ai_leads", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminAiLeadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const email = d.email?.trim() ? d.email.trim() : null;

  const { data: lead, error } = await ctx.supabase
    .from("ai_leads")
    .insert({
      session_id: d.session_id,
      name: d.name?.trim() || null,
      email,
      phone: d.phone?.trim() || null,
      company: d.company?.trim() || null,
      country: d.country?.trim() || null,
      product_interest: d.product_interest?.trim() || null,
      project_description: d.project_description?.trim() || null,
      conversation_summary: d.conversation_summary?.trim() || null,
      status: "new",
    })
    .select("*")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "ai_leads.created",
    section: "ai_leads",
    recordId: lead.id,
    recordLabel: email ?? lead.id,
    afterValues: { session_id: d.session_id },
    source: "dashboard",
  });

  await queueERPEvent(
    ERP_EVENTS.LEAD_CAPTURED,
    {
      lead_id: lead.id,
      session_id: d.session_id,
      email,
      company: d.company?.trim() || null,
    },
    lead.id as string,
    ctx.user.email,
  );

  return NextResponse.json({ data: { lead: lead as unknown as AILeadRow } });
}
