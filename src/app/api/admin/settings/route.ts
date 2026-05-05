import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { encryptValue } from "@/lib/email/encrypt";
import { adminSettingsPatchSchema } from "@/lib/schemas/admin-cms";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await ctx.supabase.from("settings").select("key, value");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ data: { settings } });
}

export async function PATCH(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { updates } = parsed.data;
  let count = 0;

  for (const { key, value } of updates) {
    let stored: unknown = value;
    if (key === "email_smtp_password_encrypted") {
      if (typeof value !== "string" || !value.trim()) {
        continue;
      }
      stored = encryptValue(value.trim());
    }
    const { error } = await ctx.supabase.from("settings").upsert(
      { key, value: stored },
      { onConflict: "key" },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    count++;
  }

  const safeForAudit = updates.map((u) =>
    u.key === "email_smtp_password_encrypted" ? { key: u.key, value: "[redacted]" as unknown } : u,
  );

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "settings.updated",
    section: "settings",
    recordId: "settings",
    afterValues: { updates: safeForAudit },
    source: "dashboard",
  });

  return NextResponse.json({ data: { updated: count } });
}
