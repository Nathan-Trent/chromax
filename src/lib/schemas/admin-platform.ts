import { z } from "zod";

export const adminUserRolesBodySchema = z
  .object({
    role_ids: z.array(z.string().uuid()),
  })
  .strict();

export const adminInviteUserSchema = z
  .object({
    email: z.string().email(),
    role_id: z.string().uuid().optional().nullable(),
  })
  .strict();

export const adminRoleCreateSchema = z
  .object({
    name: z.string().min(1),
    permissions: z.record(z.string(), z.record(z.string(), z.boolean())),
  })
  .strict();

export const adminRoleUpdateSchema = adminRoleCreateSchema.partial();

export const adminWorkflowUpsertSchema = z
  .object({
    action_type: z.string().min(1),
    label: z.string().min(1),
    approver_role_id: z.union([z.string().uuid(), z.null()]),
    notification_channels: z.array(z.enum(["in_app", "email"])),
    draft_until_approved: z.boolean(),
    is_active: z.boolean(),
  })
  .strict();

export const adminWorkflowPatchBodySchema = z
  .object({
    approver_role_id: z.union([z.string().uuid(), z.null()]).optional(),
    notification_channels: z.array(z.enum(["in_app", "email"])).optional(),
    draft_until_approved: z.boolean().optional(),
    is_active: z.boolean().optional(),
    label: z.string().min(1).optional(),
  })
  .strict();

export const adminPendingRejectSchema = z
  .object({
    comment: z.string().optional(),
  })
  .strict();

export const adminAuditLogQuerySchema = z.object({
  search: z.string().optional(),
  user_email: z.string().optional(),
  action_type: z.string().optional(),
  source: z.enum(["dashboard", "erp", "ai", "system"]).optional(),
  section: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const adminAiLeadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "converted", "lost"]),
});

export const adminAiLeadsQuerySchema = z.object({
  status: z.enum(["new", "contacted", "converted", "lost", "all"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const adminAiLeadCreateSchema = z
  .object({
    session_id: z.string().min(1),
    name: z.string().max(500).optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(100).optional().nullable(),
    company: z.string().max(500).optional().nullable(),
    country: z.string().max(200).optional().nullable(),
    product_interest: z.string().max(2000).optional().nullable(),
    project_description: z.string().max(8000).optional().nullable(),
    conversation_summary: z.string().max(8000).optional().nullable(),
  })
  .strict();
