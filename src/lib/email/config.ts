import { decryptValue } from "@/lib/email/encrypt";
import { createServiceRoleClient } from "@/lib/supabase/service";

export interface SMTPConfig {
  enabled: boolean;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  notifications: Record<string, boolean>;
  isConfigured: boolean;
}

function asBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function asNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  order_confirmation: true,
  order_status_update: true,
  b2b_offer_received: true,
  b2b_offer_response: true,
  approval_requested: true,
  approval_actioned: true,
  password_reset: true,
  welcome: true,
  staff_invite: true,
  erp_sync_review: true,
  erp_sync_auto_applied: true,
  erp_sync_actioned: true,
};

export async function getEmailConfig(): Promise<SMTPConfig> {
  const empty: SMTPConfig = {
    enabled: false,
    fromName: "",
    fromAddress: "",
    replyTo: "",
    host: "",
    port: 587,
    username: "",
    password: "",
    secure: false,
    notifications: { ...DEFAULT_NOTIFICATIONS },
    isConfigured: false,
  };

  try {
    const service = createServiceRoleClient();
    const keys = [
      "email_enabled",
      "email_from_name",
      "email_from_address",
      "email_reply_to",
      "email_smtp_host",
      "email_smtp_port",
      "email_smtp_username",
      "email_smtp_password_encrypted",
      "email_smtp_secure",
      "email_notifications",
    ] as const;

    const { data: rows, error } = await service.from("settings").select("key, value").in("key", [...keys]);
    if (error) {
      console.warn("[getEmailConfig]", error.message);
      return empty;
    }

    const map = new Map<string, unknown>();
    for (const row of rows ?? []) {
      map.set(row.key, row.value);
    }

    const notifRaw = map.get("email_notifications");
    const notifications = { ...DEFAULT_NOTIFICATIONS };
    if (notifRaw && typeof notifRaw === "object" && !Array.isArray(notifRaw)) {
      for (const [k, val] of Object.entries(notifRaw as Record<string, unknown>)) {
        if (typeof val === "boolean") notifications[k] = val;
      }
    }

    const host = asString(map.get("email_smtp_host")).trim();
    const username = asString(map.get("email_smtp_username")).trim();
    const encPw = asString(map.get("email_smtp_password_encrypted"));
    const password = decryptValue(encPw).trim();

    return {
      enabled: asBool(map.get("email_enabled"), false),
      fromName: asString(map.get("email_from_name")).trim() || "Chromax-MCR",
      fromAddress: asString(map.get("email_from_address")).trim(),
      replyTo: asString(map.get("email_reply_to")).trim(),
      host,
      port: asNumber(map.get("email_smtp_port"), 587),
      username,
      password,
      secure: asBool(map.get("email_smtp_secure"), false),
      notifications,
      isConfigured: Boolean(host && username && password),
    };
  } catch (e) {
    console.warn("[getEmailConfig] unexpected:", e);
    return empty;
  }
}
