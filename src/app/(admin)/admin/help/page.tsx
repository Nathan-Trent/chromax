import { HelpClient } from "@/components/admin/help/HelpClient";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import { redirect } from "next/navigation";

function buildPermissionsMap(roles: Role[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const role of roles) {
    for (const [section, actions] of Object.entries(role.permissions)) {
      if (!actions || typeof actions !== "object") continue;
      if (!map[section]) map[section] = [];
      for (const [action, val] of Object.entries(actions)) {
        if (val === true && !map[section].includes(action)) {
          map[section].push(action);
        }
      }
    }
  }
  for (const k of Object.keys(map)) {
    map[k].sort();
  }
  return map;
}

export default async function AdminHelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(
      `
      roles (
        id,
        name,
        description,
        permissions,
        is_system
      )
    `,
    )
    .eq("user_id", user.id);

  const roles = parseUserRoleRows(userRoleRows ?? []);
  const superUser = isSuperAdmin(roles);
  const permissions = buildPermissionsMap(roles);

  return <HelpClient roles={roles} isSuperAdmin={superUser} permissions={permissions} />;
}
