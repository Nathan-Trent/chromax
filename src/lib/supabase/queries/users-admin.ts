import { parseRoleRecord } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Role } from "@/types/role";
import type { UserWithRoles } from "@/types/admin-workflows";

const USER_ROLES_SELECT = `
  roles (
    id,
    name,
    description,
    permissions,
    is_system
  )
`;

/**
 * Lists all auth users with assigned roles (Super Admin tooling).
 * Uses service role for Auth API and the passed server client for user_roles.
 */
export async function listAllUsersWithRoles(): Promise<UserWithRoles[]> {
  const supabase = await createClient();
  const service = createServiceRoleClient();

  const authUsers: { id: string; email?: string; created_at?: string }[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }
    const batch = data.users ?? [];
    authUsers.push(
      ...batch.map((u) => ({
        id: u.id,
        email: u.email ?? undefined,
        created_at: u.created_at,
      })),
    );
    if (batch.length < perPage) break;
    page++;
  }

  const userIds = authUsers.map((u) => u.id);
  if (userIds.length === 0) return [];

  const { data: urRows, error: urErr } = await supabase
    .from("user_roles")
    .select(`user_id, ${USER_ROLES_SELECT}`)
    .in("user_id", userIds);

  if (urErr) {
    throw new Error(urErr.message);
  }

  const rolesByUser = new Map<string, Role[]>();
  for (const row of urRows ?? []) {
    const r = row as { user_id: string; roles: unknown };
    const role = parseRoleRecord(r.roles);
    if (!role) continue;
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(role);
    rolesByUser.set(r.user_id, list);
  }

  return authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? "—",
    created_at: u.created_at ?? new Date(0).toISOString(),
    roles: rolesByUser.get(u.id) ?? [],
  }));
}
