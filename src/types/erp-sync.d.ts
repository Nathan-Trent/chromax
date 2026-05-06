export type ERPSyncPendingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "auto_applied"
  | "undone";

export type ERPSyncPendingRow = {
  id: string;
  event_type: string;
  direction: "erp_to_dashboard" | "dashboard_to_erp";
  erp_product_id: number | null;
  dashboard_product_id: string | null;
  field_changed: string | null;
  current_value: Record<string, unknown> | null;
  incoming_value: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  status: ERPSyncPendingStatus;
  auto_applied: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  undone_at: string | null;
  undone_by: string | null;
  created_at: string;
};

export type ERPSyncSettingsRow = {
  id: string;
  event_type: string;
  label: string;
  auto_sync: boolean;
  undo_window_hours: number;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
};
