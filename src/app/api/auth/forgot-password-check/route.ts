import { RECAPTCHA_USER_ERROR, verifyRecaptcha } from "@/lib/recaptcha/verify";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z
  .object({
    email: z.string().email(),
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

  const { email } = parsed.data;
  const token = parsed.data.recaptchaToken ?? "";
  const v = await verifyRecaptcha(token, "forgot_password", 0.5);
  if (!v.success) {
    return NextResponse.json({ error: RECAPTCHA_USER_ERROR }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl.replace(/\/$/, "")}/account/reset-password`;

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ data: { sent: true as const } });
}
