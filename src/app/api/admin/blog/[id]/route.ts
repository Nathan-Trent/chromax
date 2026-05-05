import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminBlogUpdateSchema } from "@/lib/schemas/admin-cms";
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
  if (!hasPermission(ctx.roles, "blog", "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: post, error } = await ctx.supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { post } });
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
  if (!hasPermission(ctx.roles, "blog", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminBlogUpdateSchema.safeParse(body);
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
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = { ...patch };
  if (patch.cover_image_url === "") updatePayload.cover_image_url = null;

  const { data: post, error: updErr } = await ctx.supabase
    .from("blog_posts")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updErr) {
    if (updErr.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  if (!post) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "blog.post_updated",
    section: "blog",
    recordId: id,
    recordLabel: post.title,
    beforeValues: existing,
    afterValues: post,
    source: "dashboard",
  });

  return NextResponse.json({ data: { post } });
}
