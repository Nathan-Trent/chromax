import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { voidNotifyApprovalEmailsForWorkflow } from "@/lib/approvals/notify-approvers";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminContentPatchSchema } from "@/lib/schemas/admin-cms";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

function revalidatePublicContent() {
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/projects");
  revalidatePath("/certifications");
  revalidatePath("/admin/content", "layout");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ page_key: string }> },
) {
  const { page_key } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "content", "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: page, error } = await ctx.supabase
    .from("content_pages")
    .select("*")
    .eq("page_key", page_key)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { page } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ page_key: string }> },
) {
  const { page_key } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "content", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminContentPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { content: newContent, status: newStatus } = parsed.data;

  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("content_pages")
    .select("*")
    .eq("page_key", page_key)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: workflow } = await ctx.supabase
    .from("approval_workflows")
    .select("id")
    .eq("action_type", "content.page_updated")
    .eq("is_active", true)
    .maybeSingle();

  if (workflow) {
    const { data: pendingRow, error: pendErr } = await ctx.supabase
      .from("pending_changes")
      .insert({
        workflow_id: workflow.id,
        action_type: "content.page_updated",
        section: "content",
        record_id: existing.id,
        record_label: page_key,
        submitted_by: ctx.user.id,
        before_values: { content: existing.content, status: existing.status },
        after_values: {
          content: newContent,
          ...(newStatus ? { status: newStatus } : {}),
        },
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (pendErr || !pendingRow) {
      return NextResponse.json(
        { error: pendErr?.message ?? "Could not create pending change" },
        { status: 500 },
      );
    }

    await writeAuditLog(ctx.supabase, {
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userRole: roleNamesCsv(ctx.roles),
      actionType: "content.page_updated.pending",
      section: "content",
      recordId: existing.id,
      recordLabel: page_key,
      beforeValues: { content: existing.content, status: existing.status },
      afterValues: { content: newContent, status: newStatus ?? existing.status },
      source: "dashboard",
      pendingChangeId: pendingRow.id,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    voidNotifyApprovalEmailsForWorkflow(workflow.id, {
      actionType: "content.page_updated",
      recordLabel: page_key,
      submittedByEmail: ctx.user.email,
      dashboardUrl: `${appUrl.replace(/\/$/, "")}/admin/workflows`,
    });

    return NextResponse.json({ data: { pending: true as const, change_id: pendingRow.id } });
  }

  const updatePayload: Record<string, unknown> = {
    content: newContent,
    last_edited_by: ctx.user.id,
  };
  if (newStatus) {
    updatePayload.status = newStatus;
  }

  const { data: page, error: updErr } = await ctx.supabase
    .from("content_pages")
    .update(updatePayload)
    .eq("id", existing.id)
    .select("*")
    .maybeSingle();

  if (updErr || !page) {
    return NextResponse.json({ error: updErr?.message ?? "Update failed" }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "content.page_updated",
    section: "content",
    recordId: existing.id,
    recordLabel: page_key,
    beforeValues: { content: existing.content, status: existing.status },
    afterValues: { content: newContent, status: page.status },
    source: "dashboard",
  });

  revalidatePublicContent();
  return NextResponse.json({ data: { page } });
}
