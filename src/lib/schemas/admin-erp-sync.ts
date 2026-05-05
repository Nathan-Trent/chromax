import { z } from "zod";

export const adminErpSyncLogQuerySchema = z.object({
  status: z.enum(["all", "success", "failed", "dead_letter", "retrying"]).optional(),
  direction: z.enum(["all", "dashboard_to_erp", "erp_to_dashboard"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
