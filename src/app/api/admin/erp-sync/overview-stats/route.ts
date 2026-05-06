import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { getErpOverviewStats } from "@/lib/erp/overview-stats";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "erp_sync", "view")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  const overview = await getErpOverviewStats(ctx.supabase);
  return NextResponse.json({ data: { overview } });
}
