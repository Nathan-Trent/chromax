import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminProjectCreateSchema } from "@/lib/schemas/admin-cms";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "projects", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminProjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const insert = {
    title: d.title,
    slug: d.slug,
    sector: d.sector,
    client_name: d.client_name ?? null,
    location: d.location ?? null,
    description: d.description ?? null,
    body_html: d.body_html ?? null,
    is_case_study: d.is_case_study,
    status: d.status,
  };

  const { data: project, error } = await ctx.supabase.from("projects").insert(insert).select("*").single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "project.created",
    section: "projects",
    recordId: project.id,
    recordLabel: project.title,
    afterValues: project,
    source: "dashboard",
  });

  return NextResponse.json({ data: { project } });
}
