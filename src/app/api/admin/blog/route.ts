import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminBlogCreateSchema } from "@/lib/schemas/admin-cms";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "blog", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminBlogCreateSchema.safeParse(body);
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
    excerpt: d.excerpt ?? null,
    body_html: d.body_html ?? null,
    cover_image_url: d.cover_image_url ?? null,
    post_type: d.post_type,
    status: d.status,
    published_at: d.published_at ?? null,
    seo_title: d.seo_title ?? null,
    seo_description: d.seo_description ?? null,
    author_id: ctx.user.id,
    author_name: ctx.user.email,
  };

  const { data: post, error } = await ctx.supabase.from("blog_posts").insert(insert).select("*").single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "blog.post_created",
    section: "blog",
    recordId: post.id,
    recordLabel: post.title,
    afterValues: post,
    source: "dashboard",
  });

  return NextResponse.json({ data: { post } });
}
