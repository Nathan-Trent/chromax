import { sendEmail } from "@/lib/email/sender";
import { postAuthRegisterSchema } from "@/lib/schemas/auth-register";
import { RECAPTCHA_USER_ERROR, verifyRecaptcha } from "@/lib/recaptcha/verify";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postAuthRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const recaptchaToken = parsed.data.recaptchaToken ?? "";
  const recaptcha = await verifyRecaptcha(recaptchaToken, "register", 0.5);
  if (!recaptcha.success) {
    return NextResponse.json({ error: RECAPTCHA_USER_ERROR }, { status: 400 });
  }

  const { userId, fullName, email, marketingConsent } = parsed.data;

  try {
    const service = createServiceRoleClient();
    const { error } = await service.from("customers").upsert(
      {
        id: userId,
        full_name: fullName,
        marketing_consent: marketingConsent,
      },
      { onConflict: "id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  void sendEmail({
    to: email,
    template: "welcome",
    data: { customerName: fullName },
    notificationType: "welcome",
  });

  return NextResponse.json({ data: { success: true as const } });
}
