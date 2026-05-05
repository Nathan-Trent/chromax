import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminCertCreateSchema } from "@/lib/schemas/admin-cms";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "certifications", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminCertCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const insert = {
    name: d.name,
    cert_type: d.cert_type,
    issuing_body: d.issuing_body ?? null,
    issue_date: d.issue_date || null,
    expiry_date: d.expiry_date || null,
    document_url: d.document_url ?? null,
    product_id: d.product_id && d.product_id !== "" ? d.product_id : null,
    display_order: d.display_order,
    active: d.active,
  };

  const { data: certification, error } = await ctx.supabase
    .from("certifications")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "certification.created",
    section: "certifications",
    recordId: certification.id,
    recordLabel: certification.name,
    afterValues: certification,
    source: "dashboard",
  });

  return NextResponse.json({ data: { certification } });
}
