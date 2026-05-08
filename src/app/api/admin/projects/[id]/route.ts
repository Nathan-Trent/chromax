import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminProjectUpdateSchema } from "@/lib/schemas/admin-cms";
import { revalidatePath } from "next/cache";
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
  if (!hasPermission(ctx.roles, "projects", "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: project, error } = await ctx.supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { project } });
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
  if (!hasPermission(ctx.roles, "projects", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminProjectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const patch = parsed.data;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: project, error: updErr } = await ctx.supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updErr) {
    if (updErr.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "project.updated",
    section: "projects",
    recordId: id,
    recordLabel: project.title,
    beforeValues: existing,
    afterValues: project,
    source: "dashboard",
  });

  revalidatePath("/projects");
  const prevSlug = typeof existing.slug === "string" ? existing.slug : "";
  const nextSlug = typeof project.slug === "string" ? project.slug : "";
  if (prevSlug) revalidatePath(`/projects/${prevSlug}`);
  if (nextSlug && nextSlug !== prevSlug) revalidatePath(`/projects/${nextSlug}`);

  return NextResponse.json({ data: { project } });
}
