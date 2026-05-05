import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";

export type AdminRequestUser = { id: string; email: string };

export type AdminRequestContext = {
  user: AdminRequestUser;
  roles: Role[];
  supabase: Awaited<ReturnType<typeof createClient>>;
};

const USER_ROLES_SELECT = `
  roles (
    id,
    name,
    description,
    permissions,
    is_system
  )
`;

export async function getAdminRequestContext(): Promise<AdminRequestContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(USER_ROLES_SELECT)
    .eq("user_id", user.id);

  const roles = parseUserRoleRows(userRoleRows ?? []);

  return {
    user: { id: user.id, email: user.email },
    roles,
    supabase,
  };
}

export function roleNamesCsv(roles: Role[]): string {
  return roles.map((r) => r.name).join(", ") || "—";
}
