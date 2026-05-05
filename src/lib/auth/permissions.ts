import type { Role } from "@/types/role";

export function hasPermission(
  roles: Role[],
  section: string,
  action: string,
): boolean {
  for (const role of roles) {
    const sectionPerms = role.permissions[section];
    if (sectionPerms && sectionPerms[action] === true) {
      return true;
    }
  }
  return false;
}

export function isSuperAdmin(roles: Role[]): boolean {
  return roles.some(
    (r) => r.is_system === true && r.name === "Super Admin",
  );
}

const CONTENT_NAV_CHECKS: { section: string; actions: string[] }[] = [
  {
    section: "products",
    actions: ["view", "create", "edit", "delete", "approve_pricing"],
  },
  { section: "swatches", actions: ["view", "edit"] },
  { section: "content", actions: ["view", "create", "edit", "delete"] },
  { section: "blog", actions: ["view", "create", "edit", "delete"] },
  { section: "projects", actions: ["view", "edit"] },
  { section: "certifications", actions: ["view", "edit"] },
];

export function hasAnyContentNavPermission(roles: Role[]): boolean {
  for (const { section, actions } of CONTENT_NAV_CHECKS) {
    for (const action of actions) {
      if (hasPermission(roles, section, action)) {
        return true;
      }
    }
  }
  return false;
}

const OPERATIONS_NAV_CHECKS: { section: string; actions: string[] }[] = [
  {
    section: "orders",
    actions: ["view", "fulfil", "cancel_request", "cancel_approve"],
  },
  { section: "b2b", actions: ["view", "respond", "approve"] },
  { section: "ai_leads", actions: ["view", "create", "edit", "delete"] },
];

export function hasAnyOperationsNavPermission(roles: Role[]): boolean {
  for (const { section, actions } of OPERATIONS_NAV_CHECKS) {
    for (const action of actions) {
      if (hasPermission(roles, section, action)) {
        return true;
      }
    }
  }
  return false;
}
