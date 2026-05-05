export type RolePermissions = Record<string, Record<string, boolean>>;

export type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermissions;
  is_system: boolean;
};
