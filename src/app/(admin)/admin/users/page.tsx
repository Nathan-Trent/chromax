import { UsersRolesClient } from "@/components/admin/users/UsersRolesClient";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { fetchAdminUsersDashboard } from "@/lib/supabase/queries/users-dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(`roles ( id, name, description, permissions, is_system )`)
    .eq("user_id", user.id);
  const roles = parseUserRoleRows(userRoleRows ?? []);

  const canAccess = isSuperAdmin(roles) || hasPermission(roles, "users", "view");
  if (!canAccess) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-sans text-2xl font-semibold text-[#1a1a2e]">Users &amp; Roles</h1>
        <p className="font-sans text-[#888888]">
          You don&apos;t have access to this section. Users access requires permission to view Users.
        </p>
      </div>
    );
  }

  const viewerSuperAdmin = isSuperAdmin(roles);
  const { activeStaff, pendingInvites, customers } = await fetchAdminUsersDashboard({
    viewerSuperAdmin,
  });

  const { data: roleRows, error } = await supabase.from("roles").select("*").order("name");
  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Users &amp; Roles</h1>
      <p className="mt-1 font-sans text-sm text-[#888888]">Staff invitations, roles, and customer accounts.</p>

      <div className="mt-8">
        <UsersRolesClient
          activeStaff={activeStaff}
          pendingInvites={pendingInvites}
          customers={customers}
          roles={(roleRows ?? []) as unknown as Role[]}
          currentUserId={user.id}
          isSuperAdminViewer={viewerSuperAdmin}
        />
      </div>
    </div>
  );
}
