import { RECAPTCHA_USER_ERROR, verifyRecaptcha } from "@/lib/recaptcha/verify";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z
  .object({
    recaptchaToken: z.string().optional(),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const token = parsed.data.recaptchaToken ?? "";
  const v = await verifyRecaptcha(token, "login", 0.5);
  if (!v.success) {
    return NextResponse.json({ error: RECAPTCHA_USER_ERROR }, { status: 400 });
  }

  return NextResponse.json({ data: { verified: true as const } });
}
