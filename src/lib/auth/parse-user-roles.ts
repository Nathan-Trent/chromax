import type { Role } from "@/types/role";

/**
 * Parses one `roles` table row from Supabase (flat object).
 */
export function parseRoleRecord(raw: unknown): Role | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  const name = o.name;
  if (typeof id !== "string" || typeof name !== "string") return null;
  const desc = o.description;
  const permsRaw = o.permissions;
  const perms =
    permsRaw && typeof permsRaw === "object" && !Array.isArray(permsRaw)
      ? (permsRaw as Role["permissions"])
      : {};
  return {
    id,
    name,
    description: typeof desc === "string" ? desc : desc == null ? null : String(desc),
    permissions: perms,
    is_system: Boolean(o.is_system),
  };
}

/**
 * Normalizes the nested `roles` field from a `user_roles` select with join.
 * Supabase may return a single object, an array of one (or more), or null.
 */
export function normalizeJoinedRoles(nested: unknown): Role[] {
  if (nested == null) return [];
  if (Array.isArray(nested)) {
    return nested.map(parseRoleRecord).filter((role): role is Role => role !== null);
  }
  const one = parseRoleRecord(nested);
  return one ? [one] : [];
}

export function parseUserRoleRows(
  rows: { roles?: unknown }[] | null | undefined,
): Role[] {
  if (!rows?.length) return [];
  return rows.flatMap((row) => normalizeJoinedRoles(row?.roles));
}
