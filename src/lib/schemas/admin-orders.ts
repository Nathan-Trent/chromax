import { z } from "zod";

const orderStatusSchema = z.enum([
  "new",
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
]);

export const adminOrderStatusPatchSchema = z
  .object({
    status: orderStatusSchema,
    tracking_number: z.string().max(500).optional().nullable(),
    courier: z.string().max(200).optional().nullable(),
  })
  .strict();

export const adminOrdersListQuerySchema = z.object({
  status: z.string().optional(),
  currency: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const orderCancellationSchema = z
  .object({
    action: z.enum(["request", "approve"]),
  })
  .strict();
