import type { Role } from "@/types/role";

export type UserWithRoles = {
  id: string;
  email: string;
  created_at: string;
  roles: Role[];
};

export type StaffMemberRow = UserWithRoles & {
  banned_until?: string | null;
};

export type PendingInviteRow = {
  id: string;
  email: string;
  invited_at: string;
  role_name?: string;
};

export type CustomerDashboardRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  confirmed_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  internal_notes: string | null;
  order_count: number;
};

export type ApprovalWorkflowRow = {
  id: string;
  action_type: string;
  label: string;
  approver_role_id: string | null;
  notification_channels: unknown;
  draft_until_approved: boolean;
  is_active: boolean;
  created_by: string | null;
  updated_at: string;
};

export type PendingChangeRow = {
  id: string;
  workflow_id: string | null;
  action_type: string;
  section: string;
  record_id: string | null;
  record_label: string | null;
  submitted_by: string | null;
  before_values: unknown;
  after_values: unknown;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approver_id: string | null;
  approver_comment: string | null;
  actioned_at: string | null;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action_type: string;
  section: string;
  record_id: string | null;
  record_label: string | null;
  before_values: unknown;
  after_values: unknown;
  source: "dashboard" | "erp" | "ai" | "system";
  pending_change_id: string | null;
  ip_address: string | null;
  created_at: string;
};

export type AILeadRow = {
  id: string;
  session_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  country: string | null;
  product_interest: string | null;
  project_description: string | null;
  conversation_summary: string | null;
  status: "new" | "contacted" | "converted" | "lost";
  erp_synced_at: string | null;
  erp_lead_id: string | null;
  created_at: string;
  updated_at: string;
};
