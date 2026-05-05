import { z } from "zod";

export const adminContentPatchSchema = z
  .object({
    content: z.record(z.string(), z.unknown()),
    status: z.enum(["draft", "live"]).optional(),
  })
  .strict();

export const adminBlogCreateSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    excerpt: z.string().max(200).nullable().optional(),
    body_html: z.string().nullable().optional(),
    cover_image_url: z.string().max(2048).nullable().optional(),
    post_type: z.enum(["blog", "guide"]),
    status: z.enum(["draft", "live", "archived"]),
    published_at: z.string().nullable().optional(),
    seo_title: z.string().nullable().optional(),
    seo_description: z.string().nullable().optional(),
  })
  .strict();

export const adminBlogUpdateSchema = adminBlogCreateSchema.partial();

export const adminProjectCreateSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    sector: z.enum([
      "offshore",
      "construction",
      "automotive",
      "marine",
      "infrastructure",
    ]),
    client_name: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    description: z.string().max(200).nullable().optional(),
    body_html: z.string().nullable().optional(),
    is_case_study: z.boolean(),
    status: z.enum(["draft", "live", "archived"]),
  })
  .strict();

export const adminProjectUpdateSchema = adminProjectCreateSchema.partial();

export const adminCertCreateSchema = z
  .object({
    name: z.string().min(1),
    cert_type: z.enum(["iso", "export_licence", "msds", "award", "other"]),
    issuing_body: z.string().nullable().optional(),
    issue_date: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    document_url: z.string().max(2048).nullable().optional(),
    product_id: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
    display_order: z.number().int(),
    active: z.boolean(),
  })
  .strict();

export const adminCertUpdateSchema = adminCertCreateSchema.partial();

export const adminSettingsPatchSchema = z
  .object({
    updates: z.array(
      z.object({
        key: z.string().min(1),
        value: z.unknown(),
      }),
    ),
  })
  .strict();
