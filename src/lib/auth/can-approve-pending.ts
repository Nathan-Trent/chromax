import type { AdminRequestContext } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";

export function canApprovePendingChange(
  ctx: AdminRequestContext,
  approverRoleId: string | null,
): boolean {
  if (isSuperAdmin(ctx.roles)) {
    return true;
  }
  if (!approverRoleId) {
    return isSuperAdmin(ctx.roles);
  }
  return ctx.roles.some((r) => r.id === approverRoleId);
}
