import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminAiLeadStatusSchema } from "@/lib/schemas/admin-platform";
import type { AILeadRow } from "@/types/admin-workflows";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "ai_leads", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminAiLeadStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { data: existing, error: fErr } = await ctx.supabase
    .from("ai_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: lead, error: uErr } = await ctx.supabase
    .from("ai_leads")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (uErr || !lead) {
    return NextResponse.json({ error: uErr?.message ?? "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "ai_leads.status_updated",
    section: "ai_leads",
    recordId: id,
    recordLabel: lead.email ?? id,
    beforeValues: { status: existing.status },
    afterValues: { status: lead.status },
    source: "dashboard",
  });

  return NextResponse.json({ data: { lead: lead as unknown as AILeadRow } });
}
