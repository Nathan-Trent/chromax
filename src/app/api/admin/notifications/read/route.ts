import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const ids = (body as { ids?: string[] }).ids;

  let q = ctx.supabase.from("notifications").update({ read: true }).eq("user_id", ctx.user.id);

  if (Array.isArray(ids) && ids.length > 0) {
    q = q.in("id", ids);
  }

  const { data, error } = await q.select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { updated: data?.length ?? 0 } });
}
