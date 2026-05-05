import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { listAllUsersWithRoles } from "@/lib/supabase/queries/users-admin";
import type { UserWithRoles } from "@/types/admin-workflows";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users: UserWithRoles[] = await listAllUsersWithRoles();
    return NextResponse.json({ data: { users } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list users" },
      { status: 500 },
    );
  }
}
