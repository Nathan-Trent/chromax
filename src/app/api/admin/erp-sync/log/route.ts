import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminErpSyncLogQuerySchema } from "@/lib/schemas/admin-erp-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "view")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsedRaw = {
    status: searchParams.get("status") ?? "all",
    direction: searchParams.get("direction") ?? "all",
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "50",
  };
  const parsed = adminErpSyncLogQuerySchema.safeParse(parsedRaw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { status, direction } = parsed.data;
  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const [totalRes, successRes, failedRes, lastRes] = await Promise.all([
    ctx.supabase.from("erp_sync_log").select("*", { count: "exact", head: true }),
    ctx.supabase.from("erp_sync_log").select("*", { count: "exact", head: true }).eq("status", "success"),
    ctx.supabase
      .from("erp_sync_log")
      .select("*", { count: "exact", head: true })
      .in("status", ["failed", "dead_letter"]),
    ctx.supabase
      .from("erp_sync_log")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const total = totalRes.count ?? 0;
  const success = successRes.count ?? 0;
  const failed = failedRes.count ?? 0;
  const successRate = total > 0 ? Math.round((success / total) * 1000) / 10 : 0;

  let rowQuery = ctx.supabase
    .from("erp_sync_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    rowQuery = rowQuery.eq("status", status);
  }
  if (direction && direction !== "all") {
    rowQuery = rowQuery.eq("direction", direction);
  }

  const { data: rows, error } = await rowQuery.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      rows: rows ?? [],
      stats: {
        total,
        successRate,
        failed,
        lastSync: (lastRes.data?.created_at as string | undefined) ?? null,
      },
      page,
      limit,
    },
  });
}
