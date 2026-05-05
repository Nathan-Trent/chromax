import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminCertUpdateSchema } from "@/lib/schemas/admin-cms";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "certifications", "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: certification, error } = await ctx.supabase
    .from("certifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!certification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { certification } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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

  const parsed = adminCertUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const patch = { ...parsed.data } as Record<string, unknown>;
  if (patch.product_id !== undefined) {
    patch.product_id =
      typeof patch.product_id === "string" && patch.product_id.trim() ? patch.product_id.trim() : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("certifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: certification, error: updErr } = await ctx.supabase
    .from("certifications")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updErr || !certification) {
    return NextResponse.json({ error: updErr?.message ?? "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "certification.updated",
    section: "certifications",
    recordId: id,
    recordLabel: certification.name,
    beforeValues: existing,
    afterValues: certification,
    source: "dashboard",
  });

  return NextResponse.json({ data: { certification } });
}
