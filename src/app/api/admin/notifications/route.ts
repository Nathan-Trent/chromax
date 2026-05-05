import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const unreadOnly = searchParams.get("unread_only") === "1" || searchParams.get("unread_only") === "true";

  let query = ctx.supabase
    .from("notifications")
    .select("id, type, title, message, data, read, created_at")
    .eq("user_id", ctx.user.id);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data: notifications, error: nErr } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (nErr) {
    return NextResponse.json({ error: nErr.message }, { status: 500 });
  }

  const { count, error: cErr } = await ctx.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.id)
    .eq("read", false);

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      notifications: notifications ?? [],
      unread_count: count ?? 0,
    },
  });
}
