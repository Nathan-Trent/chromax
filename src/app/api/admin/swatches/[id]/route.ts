import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminSwatchUpdateSchema, HEX_RE } from "@/lib/schemas/admin-products";
import { NextResponse } from "next/server";

const SWATCH_COLUMNS =
  "id,name,hex,product_code,category,product_id,display_order,active,created_at,updated_at";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }

  if (!hasPermission(ctx.roles, "swatches", "edit")) {
    return NextResponse.json({ error: "You don't have permission to manage swatches" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminSwatchUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  if (parsed.data.hex !== undefined && !HEX_RE.test(parsed.data.hex)) {
    return NextResponse.json({ error: "Invalid hex colour" }, { status: 422 });
  }

  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("colour_swatches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Swatch not found" }, { status: 404 });
  }

  const updatePayload = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined),
  );

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const { data: swatch, error: upErr } = await ctx.supabase
    .from("colour_swatches")
    .update(updatePayload)
    .eq("id", id)
    .select(SWATCH_COLUMNS)
    .single();

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "swatch.updated",
    section: "swatches",
    recordId: id,
    recordLabel: swatch.name,
    beforeValues: existing,
    afterValues: swatch,
    source: "dashboard",
  });

  return NextResponse.json({ data: swatch });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }

  if (!hasPermission(ctx.roles, "swatches", "edit")) {
    return NextResponse.json({ error: "You don't have permission to manage swatches" }, { status: 403 });
  }

  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("colour_swatches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Swatch not found" }, { status: 404 });
  }

  const { error: upErr } = await ctx.supabase
    .from("colour_swatches")
    .update({ active: false })
    .eq("id", id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "swatch.deactivated",
    section: "swatches",
    recordId: id,
    recordLabel: String(existing.name),
    beforeValues: existing,
    afterValues: { active: false },
    source: "dashboard",
  });

  return NextResponse.json({ data: { deactivated: true as const } });
}
