import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { fetchAdminUsersDashboard } from "@/lib/supabase/queries/users-dashboard";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canAccess = isSuperAdmin(ctx.roles) || hasPermission(ctx.roles, "users", "view");
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const viewerSuperAdmin = isSuperAdmin(ctx.roles);

  try {
    const { activeStaff, pendingInvites, customers } = await fetchAdminUsersDashboard({
      viewerSuperAdmin,
    });

    return NextResponse.json({
      data: {
        users: activeStaff,
        pendingInvites,
        customers,
        isSuperAdmin: viewerSuperAdmin,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list users" },
      { status: 500 },
    );
  }
}
