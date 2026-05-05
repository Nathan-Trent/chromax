import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { getEmailConfig } from "@/lib/email/config";
import { smtpSelfTest } from "@/lib/email/templates";
import { createServiceRoleClient } from "@/lib/supabase/service";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const b = body as Record<string, unknown>;
  const base = await getEmailConfig();

  const host = typeof b.host === "string" && b.host.trim() ? b.host.trim() : base.host;
  const port =
    typeof b.port === "number" && Number.isFinite(b.port)
      ? b.port
      : Number.parseInt(String(b.port ?? base.port), 10) || base.port;
  const username =
    typeof b.username === "string" && b.username.trim() ? b.username.trim() : base.username;
  const password =
    typeof b.password === "string" && b.password.trim() ? b.password.trim() : base.password;

  const secure = typeof b.secure === "boolean" ? b.secure : base.secure;
  const fromName =
    typeof b.from_name === "string" && b.from_name.trim()
      ? b.from_name.trim()
      : base.fromName;
  const fromAddress =
    typeof b.from_address === "string" && b.from_address.trim()
      ? b.from_address.trim()
      : base.fromAddress;

  if (!host || !username || !password) {
    return NextResponse.json(
      { error: "Host, username, and password are required to send a test email." },
      { status: 422 },
    );
  }
  if (!fromAddress) {
    return NextResponse.json({ error: "From address is required." }, { status: 422 });
  }

  const tpl = smtpSelfTest();

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: username, pass: password },
    });
    const fromHeader = `${fromName} <${fromAddress}>`;
    await transporter.sendMail({
      from: fromHeader,
      to: ctx.user.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const service = createServiceRoleClient();
    await service.from("email_log").insert({
      to_email: ctx.user.email,
      subject: tpl.subject,
      template: "smtp_self_test",
      data: { source: "admin_test" },
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } catch {
    /* logging only */
  }

  return NextResponse.json({ data: { sent: true as const, to: ctx.user.email } });
}
