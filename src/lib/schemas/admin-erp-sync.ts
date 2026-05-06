import { z } from "zod";

export const adminErpSyncLogQuerySchema = z.object({
  status: z.enum(["all", "success", "failed", "dead_letter", "retrying"]).optional(),
  direction: z.enum(["all", "dashboard_to_erp", "erp_to_dashboard"]).optional(),
  pending_status: z
    .enum(["all", "pending", "approved", "auto_applied", "rejected", "undone"])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const erpSyncLinkBodySchema = z.object({
  dashboard_product_id: z.string().uuid(),
  erp_product_id: z.number().int(),
  erp_product_name: z.string().min(1).max(500),
});

export const erpSyncUnlinkBodySchema = z.object({
  dashboard_product_id: z.string().uuid(),
});

export const erpSyncPendingListQuerySchema = z.object({
  status: z
    .enum(["pending", "approved", "rejected", "auto_applied", "undone", "all"])
    .optional(),
  direction: z.enum(["erp_to_dashboard", "dashboard_to_erp", "all"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const erpSyncReviewNoteSchema = z.object({
  note: z.string().max(2000).optional(),
});

export const erpSyncSettingsPatchSchema = z.object({
  event_type: z.string().min(1),
  auto_sync: z.boolean().optional(),
  undo_window_hours: z.number().int().min(0).max(168).optional(),
  is_active: z.boolean().optional(),
});
