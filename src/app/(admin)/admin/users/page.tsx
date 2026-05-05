import { UsersRolesClient } from "@/components/admin/users/UsersRolesClient";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { listAllUsersWithRoles } from "@/lib/supabase/queries/users-admin";
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

  if (!isSuperAdmin(roles)) {
    return (
      <div className="p-8">
        <h1 className="mb-2 font-sans text-2xl font-semibold text-[#1a1a2e]">Users &amp; Roles</h1>
        <p className="font-sans text-[#888888]">Access denied. Super Admin only.</p>
      </div>
    );
  }

  const users = await listAllUsersWithRoles();
  const { data: roleRows, error } = await supabase.from("roles").select("*").order("name");
  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Users &amp; Roles</h1>
      <p className="mt-1 font-sans text-sm text-[#888888]">Invite staff, assign roles, and define custom roles.</p>

      <div className="mt-8">
        <UsersRolesClient users={users} roles={roleRows as unknown as Role[]} currentUserId={user.id} />
      </div>
    </div>
  );
}
