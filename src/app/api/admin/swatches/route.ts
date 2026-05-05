import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminSwatchCreateSchema } from "@/lib/schemas/admin-products";
import { NextResponse } from "next/server";

const SWATCH_COLUMNS =
  "id,name,hex,product_code,category,product_id,display_order,active,created_at,updated_at";

export async function POST(request: Request) {
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

  const parsed = adminSwatchCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const insert = {
    name: d.name,
    hex: d.hex,
    product_code: d.product_code,
    category: d.category,
    product_id: d.product_id ?? null,
    display_order: d.display_order,
    active: true,
  };

  const { data: swatch, error } = await ctx.supabase
    .from("colour_swatches")
    .insert(insert)
    .select(SWATCH_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "swatch.created",
    section: "swatches",
    recordId: swatch.id,
    recordLabel: swatch.name,
    afterValues: swatch,
    source: "dashboard",
  });

  return NextResponse.json({ data: swatch });
}
