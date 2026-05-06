import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { erpSyncPendingListQuerySchema } from "@/lib/schemas/admin-erp-sync";
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
  const parsed = erpSyncPendingListQuerySchema.safeParse({
    status: searchParams.get("status") ?? "pending",
    direction: searchParams.get("direction") ?? "all",
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { status, direction } = parsed.data;
  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = ctx.supabase
    .from("erp_sync_pending")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    q = q.eq("status", status);
  }
  if (direction && direction !== "all") {
    q = q.eq("direction", direction);
  }

  const { data: rows, error, count } = await q.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = [
    ...new Set(
      (rows ?? [])
        .map((r) => (r as { dashboard_product_id?: string | null }).dashboard_product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  let nameMap: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: prods } = await ctx.supabase.from("products").select("id,name").in("id", ids);
    for (const p of prods ?? []) {
      nameMap[p.id as string] = p.name as string;
    }
  }

  const items = (rows ?? []).map((r) => {
    const row = r as { dashboard_product_id?: string | null };
    const did = row.dashboard_product_id;
    return {
      ...r,
      dashboard_product_name: did ? nameMap[did] ?? null : null,

    };
  });

  return NextResponse.json({
    data: { items, total: count ?? 0, page, limit },
  });
}
