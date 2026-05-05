import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminB2bPatchSchema } from "@/lib/schemas/admin-b2b";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "b2b", "view")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  const { data: offer, error } = await ctx.supabase
    .from("b2b_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { offer } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "b2b", "view")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminB2bPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { internal_notes } = parsed.data;

  const { data: offer, error } = await ctx.supabase
    .from("b2b_offers")
    .update({ internal_notes: internal_notes ?? null })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "b2b.internal_notes_updated",
    section: "b2b",
    recordId: id,
    recordLabel: offer.reference,
    afterValues: { internal_notes: offer.internal_notes },
    source: "dashboard",
  });

  return NextResponse.json({ data: { offer } });
}
