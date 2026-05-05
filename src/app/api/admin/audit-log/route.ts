import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminAuditLogQuerySchema } from "@/lib/schemas/admin-platform";
import type { AuditLogRow } from "@/types/admin-workflows";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "audit_log", "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const qp = {
    search: searchParams.get("search") || undefined,
    user_email: searchParams.get("user_email") || undefined,
    action_type: searchParams.get("action_type") || undefined,
    source: searchParams.get("source") || undefined,
    section: searchParams.get("section") || undefined,
    start_date: searchParams.get("start_date") || undefined,
    end_date: searchParams.get("end_date") || undefined,
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "50",
  };

  const parsed = adminAuditLogQuerySchema.safeParse(qp);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { search, user_email, action_type, source, section, start_date, end_date } = parsed.data;
  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = ctx.supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    const s = `%${search.trim().replace(/%/g, "")}%`;
    q = q.or(`user_email.ilike.${s},action_type.ilike.${s}`);
  }
  if (user_email?.trim()) {
    q = q.ilike("user_email", `%${user_email.trim().replace(/%/g, "")}%`);
  }
  if (action_type?.trim()) {
    q = q.ilike("action_type", `%${action_type.trim().replace(/%/g, "")}%`);
  }
  if (source) {
    q = q.eq("source", source);
  }
  if (section?.trim()) {
    q = q.eq("section", section.trim());
  }
  if (start_date?.trim()) {
    q = q.gte("created_at", `${start_date.trim()}T00:00:00.000Z`);
  }
  if (end_date?.trim()) {
    q = q.lte("created_at", `${end_date.trim()}T23:59:59.999Z`);
  }

  const { data, error, count } = await q.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      logs: (data ?? []) as unknown as AuditLogRow[],
      total: count ?? 0,
      page,
      limit,
    },
  });
}
