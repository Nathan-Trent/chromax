import { z } from "zod";

export const adminB2bListQuerySchema = z.object({
  status: z.string().optional(),
  currency: z.string().optional(),
});

export const adminB2bPatchSchema = z
  .object({
    internal_notes: z.union([z.string().max(20000), z.null()]),
  })
  .strict();

export const b2bRespondSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("accept"),
    })
    .strict(),
  z
    .object({
      action: z.literal("counter"),
      counter_price: z.number().positive(),
      message: z.string().max(5000).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("decline"),
      message: z.string().max(5000).optional(),
    })
    .strict(),
]);
