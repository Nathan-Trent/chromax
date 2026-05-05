import { z } from "zod";

const category = z.enum([
  "industrial",
  "marine",
  "automotive",
  "architectural",
  "custom",
]);

const status = z.enum(["draft", "live", "archived"]);

function optionalPrice() {
  return z.preprocess((val: unknown) => {
    if (val === undefined || val === null || val === "") return null;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : null;
  }, z.union([z.number(), z.null()]));
}

export const adminProductCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens",
    ),
  category,
  status: status.default("draft"),
  short_desc: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price_ngn: optionalPrice().optional(),
  price_usd: optionalPrice().optional(),
  price_gbp: optionalPrice().optional(),
  requires_colour_selection: z.boolean().optional().default(false),
  is_featured: z.boolean().optional().default(false),
  stock: z.coerce.number().int().optional().default(0),
  low_threshold: z.coerce.number().int().optional().default(20),
  tds_url: z.string().nullable().optional(),
  msds_url: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
});

export const adminProductUpdateSchema = adminProductCreateSchema.partial();

export type AdminProductCreateInput = z.infer<typeof adminProductCreateSchema>;
export type AdminProductUpdateInput = z.infer<typeof adminProductUpdateSchema>;

export const HEX_RE = /^[0-9A-Fa-f]{6}$/;

export const adminSwatchCreateSchema = z.object({
  name: z.string().min(1, "Colour name is required"),
  hex: z
    .string()
    .min(6)
    .max(6)
    .regex(HEX_RE, "Hex must be exactly 6 characters A–F or 0–9"),
  product_code: z.string().min(1, "Product code is required"),
  category: z.enum(["automotive", "marine", "architectural", "industrial"]),
  product_id: z.string().uuid().nullable().optional(),
  display_order: z.coerce.number().int().optional().default(0),
});

export const adminSwatchUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  hex: z.string().min(6).max(6).regex(HEX_RE).optional(),
  product_code: z.string().min(1).optional(),
  category: z.enum(["automotive", "marine", "architectural", "industrial"]).optional(),
  product_id: z.string().uuid().nullable().optional(),
  display_order: z.coerce.number().int().optional(),
  active: z.boolean().optional(),
});

export type AdminSwatchCreateInput = z.infer<typeof adminSwatchCreateSchema>;
export type AdminSwatchUpdateInput = z.infer<typeof adminSwatchUpdateSchema>;
