import { hasAssignedSuperAdminRole } from "@/lib/auth/permissions";
import { normalizeJoinedRoles } from "@/lib/auth/parse-user-roles";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type {
  CustomerDashboardRow,
  PendingInviteRow,
  StaffMemberRow,
} from "@/types/admin-workflows";
import type { Role } from "@/types/role";

async function aggregateOrdersPerCustomer(
  service: ReturnType<typeof createServiceRoleClient>,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const batchSize = 1000;
  let offset = 0;

  for (;;) {
    const { data: chunk } = await service
      .from("orders")
      .select("customer_id")
      .not("customer_id", "is", null)
      .range(offset, offset + batchSize - 1);

    if (!chunk?.length) break;

    for (const row of chunk) {
      const cid = row.customer_id as string | null;
      if (!cid) continue;
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }

    if (chunk.length < batchSize) break;
    offset += batchSize;
  }

  return counts;
}

function mergeDuplicateRoles(list: Role[]): Role[] {
  const seen = new Set<string>();
  const result: Role[] = [];
  for (const r of list) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    result.push(r);
  }
  return result;
}

export async function fetchAdminUsersDashboard(opts: {
  viewerSuperAdmin: boolean;
}): Promise<{
  activeStaff: StaffMemberRow[];
  pendingInvites: PendingInviteRow[];
  customers: CustomerDashboardRow[];
}> {
  const service = createServiceRoleClient();

  type AuRow = {
    id: string;
    email: string;
    created_at: string;
    invited_at?: string | undefined;
    email_confirmed_at?: string | undefined;
    banned_until?: string | undefined;
  };

  const authUsers: AuRow[] = [];
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data: luData, error: luErr } = await service.auth.admin.listUsers({ page, perPage });
    if (luErr) throw new Error(luErr.message);
    const batch = luData.users ?? [];
    authUsers.push(
      ...batch.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at ?? new Date(0).toISOString(),
        invited_at: u.invited_at,
        email_confirmed_at: u.email_confirmed_at,
        banned_until: u.banned_until,
      })),
    );
    if (batch.length < perPage) break;
    page++;
  }

  const authMap = new Map(authUsers.map((u) => [u.id, u]));

  const { data: urRows, error: urErr } = await service.from("user_roles").select(`
      user_id,
      roles (
        id,
        name,
        description,
        permissions,
        is_system
      )
    `);

  if (urErr) throw new Error(urErr.message);

  const rolesByUser = new Map<string, Role[]>();

  for (const row of urRows ?? []) {
    const uid = typeof row.user_id === "string" ? row.user_id : null;
    if (!uid) continue;

    const parsed = normalizeJoinedRoles(row.roles);
    const existing = rolesByUser.get(uid) ?? [];
    rolesByUser.set(uid, mergeDuplicateRoles([...existing, ...parsed]));
  }

  const staffIdsAll = new Set<string>(rolesByUser.keys());

  function applyVisibilityFilter(roles: Role[]): boolean {
    if (opts.viewerSuperAdmin) return true;
    return !hasAssignedSuperAdminRole(roles);
  }

  const activeStaff: StaffMemberRow[] = [];
  const pendingInvites: PendingInviteRow[] = [];

  for (const userId of staffIdsAll) {
    const roles = rolesByUser.get(userId) ?? [];
    if (!applyVisibilityFilter(roles)) continue;

    const au = authMap.get(userId);
    const email = au?.email ?? "—";
    const created_at = au?.created_at ?? new Date(0).toISOString();
    const invitedAt = au?.invited_at ?? undefined;
    const confirmedAt = au?.email_confirmed_at ?? undefined;
    const banned_until = au?.banned_until ?? undefined;

    if (!confirmedAt) {
      const roleNamesArr = roles.map((r) => r.name);
      pendingInvites.push({
        id: userId,
        email,
        invited_at: invitedAt ?? created_at,
        role_name:
          roleNamesArr.length > 1 ? roleNamesArr.sort().join(", ") : roleNamesArr[0],
      });
      continue;
    }

    activeStaff.push({
      id: userId,
      email,
      created_at,
      roles,
      banned_until: banned_until ?? null,
    });
  }

  /** Customers: not staff; only super admins receive this list. */
  let customers: CustomerDashboardRow[] = [];
  if (opts.viewerSuperAdmin) {
    const orderCounts = await aggregateOrdersPerCustomer(service);

    type CustomerRowPayload = {
      id: string;
      full_name: string | null;
      created_at: string;
      internal_notes?: string | null;
      suspended_at?: string | null;
      suspension_reason?: string | null;
    };

    const { data: custRowsRaw, error: cErr } = await service
      .from("customers")
      .select(
        [
          "id",
          "full_name",
          "created_at",
          "internal_notes",
          "suspended_at",
          "suspension_reason",
        ].join(", "),
      );

    if (cErr) throw new Error(cErr.message);

    const custRows = (custRowsRaw ?? []) as unknown as CustomerRowPayload[];

    customers = custRows
      .filter((row) => !staffIdsAll.has(row.id))
      .map((row) => {
        const au = authMap.get(row.id);
        return {
          id: row.id,
          email: au?.email ?? "—",
          full_name: row.full_name ?? null,
          created_at: row.created_at,
          confirmed_at: au?.email_confirmed_at ?? null,
          suspended_at: row.suspended_at ?? null,
          suspension_reason: row.suspension_reason ?? null,
          internal_notes: row.internal_notes ?? null,
          order_count: orderCounts.get(row.id) ?? 0,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /** Stable ordering */
  activeStaff.sort((a, b) => a.email.localeCompare(b.email));
  pendingInvites.sort((a, b) => a.email.localeCompare(b.email));

  return { activeStaff, pendingInvites, customers };
}
