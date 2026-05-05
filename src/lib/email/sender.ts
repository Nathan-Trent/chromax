import { getEmailConfig } from "@/lib/email/config";
import { EMAIL_TEMPLATES } from "@/lib/email/templates";
import { notifySuperAdmins } from "@/lib/notifications/notify";
import { createServiceRoleClient } from "@/lib/supabase/service";
import nodemailer from "nodemailer";

export interface SendEmailResult {
  success: boolean;
  logId: string;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

async function updateEmailLog(
  service: ReturnType<typeof createServiceRoleClient>,
  logId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    await service.from("email_log").update(patch).eq("id", logId);
  } catch (e) {
    console.warn("[email] Failed to update email_log", logId, e);
  }
}

/**
 * Sends one transactional email and persists audit state in `email_log`.
 *
 * **Isolation from business logic (critical):**
 * - This function **never throws**. All errors are caught, written to `email_log`,
 *   and surfaced only as `{ success: false, error }` for optional diagnostics.
 * - Call sites must **not** `await` this on the critical path before returning
 *   an HTTP response. Use `void sendEmail(...)` **after** the DB update and
 *   `NextResponse.json(...)` so payment / approvals / invites always complete
 *   even when SMTP is down, misconfigured, or rate-limited.
 * - Email is a **notification layer only** — never a process gate.
 */
export async function sendEmail(options: {
  to: string;
  template: string;
  data: Record<string, unknown>;
  notificationType?: string;
}): Promise<SendEmailResult> {
  let logId = "";
  const serviceTry = () => {
    try {
      return createServiceRoleClient();
    } catch {
      return null;
    }
  };

  try {
    const service = serviceTry();
    if (!service) {
      console.warn("[email] Service role client unavailable — cannot log or send.");
      return { success: false, error: "Email service unavailable", logId: "" };
    }

    const { data: ins, error: insErr } = await service
      .from("email_log")
      .insert({
        to_email: options.to,
        subject: "(pending)",
        template: options.template,
        data: options.data,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (insErr || !ins?.id) {
      console.warn("[email] email_log insert failed:", insErr?.message);
      return { success: false, error: insErr?.message ?? "Log failed", logId: "" };
    }

    logId = ins.id;

    const config = await getEmailConfig();

    if (!config.enabled) {
      await updateEmailLog(service, logId, {
        status: "skipped",
        skip_reason: "Email disabled in settings",
        subject: "(skipped)",
      });
      return {
        success: false,
        skipped: true,
        skipReason: "Email disabled",
        logId,
      };
    }

    if (options.notificationType != null && config.notifications[options.notificationType] === false) {
      await updateEmailLog(service, logId, {
        status: "skipped",
        skip_reason: "Notification type disabled",
        subject: "(skipped)",
      });
      return {
        success: false,
        skipped: true,
        skipReason: "Notification type disabled",
        logId,
      };
    }

    if (!config.isConfigured) {
      await updateEmailLog(service, logId, {
        status: "skipped",
        skip_reason: "SMTP not configured",
        subject: "(skipped)",
      });
      void notifySuperAdmins({
        type: "email_not_configured",
        title: "Email not configured",
        message:
          "An email could not be sent because SMTP is not configured in Settings → Email.",
      });
      return {
        success: false,
        skipped: true,
        skipReason: "SMTP not configured",
        logId,
      };
    }

    const build = EMAIL_TEMPLATES[options.template];
    if (!build) {
      await updateEmailLog(service, logId, {
        status: "failed",
        error_message: "Template not found",
        subject: "(failed)",
      });
      return { success: false, error: "Template not found", logId };
    }

    const { subject, html, text } = build(options.data);
    await updateEmailLog(service, logId, { subject });

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.username, pass: config.password },
    });

    const fromHeader = `${config.fromName} <${config.fromAddress}>`;
    await transporter.sendMail({
      from: fromHeader,
      to: options.to,
      replyTo: config.replyTo || config.fromAddress,
      subject,
      text,
      html,
    });

    await updateEmailLog(service, logId, { status: "sent", sent_at: new Date().toISOString() });
    return { success: true, logId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (logId) {
      const svc = serviceTry();
      if (svc) {
        await updateEmailLog(svc, logId, {
          status: "failed",
          error_message: message,
        });
      }
    }
    void notifySuperAdmins({
      type: "email_failed",
      title: "Email delivery failed",
      message: `Failed to send [${options.template}] to [${options.to}]: ${message}`,
    });
    return { success: false, error: message, logId };
  }
}
