import type { RolePermissions } from "@/types/role";

/** Ordered sections and actions for custom role editor (matches seeded permission shape). */
export const ROLE_PERMISSION_SECTIONS: {
  key: string;
  label: string;
  actions: { key: string; label: string }[];
}[] = [
  {
    key: "products",
    label: "Products",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
      { key: "approve_pricing", label: "Approve pricing" },
    ],
  },
  {
    key: "orders",
    label: "Orders",
    actions: [
      { key: "view", label: "View" },
      { key: "fulfil", label: "Fulfil" },
      { key: "cancel_request", label: "Cancel request" },
      { key: "cancel_approve", label: "Cancel approve" },
    ],
  },
  {
    key: "b2b",
    label: "B2B",
    actions: [
      { key: "view", label: "View" },
      { key: "respond", label: "Respond" },
      { key: "approve", label: "Approve" },
    ],
  },
  {
    key: "content",
    label: "Content",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "blog",
    label: "Blog",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "projects",
    label: "Projects",
    actions: [
      { key: "view", label: "View" },
      { key: "edit", label: "Edit" },
    ],
  },
  {
    key: "certifications",
    label: "Certifications",
    actions: [
      { key: "view", label: "View" },
      { key: "edit", label: "Edit" },
    ],
  },
  {
    key: "swatches",
    label: "Swatches",
    actions: [
      { key: "view", label: "View" },
      { key: "edit", label: "Edit" },
    ],
  },
  {
    key: "users",
    label: "Users",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "workflows",
    label: "Workflows",
    actions: [
      { key: "view", label: "View" },
      { key: "edit", label: "Edit" },
    ],
  },
  {
    key: "audit_log",
    label: "Audit log",
    actions: [{ key: "view", label: "View" }],
  },
  {
    key: "erp_sync",
    label: "ERP sync",
    actions: [
      { key: "view", label: "View" },
      { key: "edit", label: "Manage sync" },
    ],
  },
  {
    key: "ai_leads",
    label: "AI leads",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
  },
];

export function emptyPermissions(): RolePermissions {
  const o: RolePermissions = {};
  for (const sec of ROLE_PERMISSION_SECTIONS) {
    o[sec.key] = {};
    for (const a of sec.actions) {
      o[sec.key][a.key] = false;
    }
  }
  return o;
}

export function permissionSectionsSummary(permissions: RolePermissions): string {
  const keys = Object.keys(permissions).filter((k) => {
    const sec = permissions[k];
    return sec && typeof sec === "object" && Object.values(sec).some(Boolean);
  });
  return keys.length ? keys.join(", ") : "—";
}
