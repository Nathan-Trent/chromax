import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export type EmailLogRow = {
  id: string;
  to_email: string;
  subject: string;
  template: string;
  status: string;
  created_at: string;
  sent_at: string | null;
};

export async function GET() {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(ctx.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const service = createServiceRoleClient();
    const { data, error } = await service
      .from("email_log")
      .select("id, to_email, subject, template, status, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: { logs: data ?? [] } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
