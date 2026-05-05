import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { NextResponse } from "next/server";

/** Stub: manual “sync to ERP” trigger — logs only until queue/webhook is wired. */
export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (
    !hasPermission(ctx.roles, "orders", "fulfil") &&
    !hasPermission(ctx.roles, "erp_sync", "view")
  ) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  console.log("[erp-sync/manual] stub invoked", body);

  return NextResponse.json({ data: { ok: true, message: "Logged — ERP queue not wired yet" } });
}
