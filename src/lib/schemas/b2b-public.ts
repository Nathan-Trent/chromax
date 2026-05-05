import { z } from "zod";

export const publicB2bOfferSchema = z
  .object({
    buyer_email: z.string().email(),
    buyer_name: z.string().min(1).max(200),
    buyer_company: z.string().max(200).optional().nullable(),
    buyer_country: z.string().max(120).optional().nullable(),
    buyer_phone: z.string().max(40).optional().nullable(),
    product_id: z.string().uuid(),
    quantity: z.number().int().positive().max(1_000_000),
    offered_price: z.number().positive(),
    currency: z.enum(["NGN", "USD", "GBP"]),
    message: z.string().max(2000).optional().nullable(),
    recaptchaToken: z.string().optional(),
  })
  .strict();
