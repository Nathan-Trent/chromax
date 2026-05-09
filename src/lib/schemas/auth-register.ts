import { z } from "zod";

export const postAuthRegisterSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    email: z.string().email(),
    marketingConsent: z.boolean(),
    recaptchaToken: z.string().optional(),
  })
  .strict();
