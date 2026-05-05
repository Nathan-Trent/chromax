import { EmailSettings } from "@/components/admin/settings/EmailSettings";
import { GeneralSettings } from "@/components/admin/settings/GeneralSettings";
import { PaymentSettings } from "@/components/admin/settings/PaymentSettings";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(`roles ( id, name, description, permissions, is_system )`)
    .eq("user_id", user.id);
  const roles: Role[] = parseUserRoleRows(userRoleRows ?? []);

  if (!isSuperAdmin(roles)) {
    return (
      <div className="p-8">
        <h1 className="mb-2 font-sans text-2xl font-semibold text-[#1a1a2e]">Settings</h1>
        <p className="font-sans text-[#888888]">Access denied. Super Admin only.</p>
      </div>
    );
  }

  const { data: rows, error } = await supabase.from("settings").select("key, value");
  if (error) {
    throw new Error(error.message);
  }

  const settings: Record<string, unknown> = {};
  for (const row of rows ?? []) {
    settings[row.key] = row.value;
  }

  if (settings.site_name === undefined) settings.site_name = "";
  if (settings.contact_email === undefined) settings.contact_email = "";
  if (settings.default_currency === undefined) settings.default_currency = "NGN";

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Settings</h1>
      <p className="mt-1 font-sans text-sm text-[#888888]">Platform configuration (Super Admin).</p>

      <div className="mx-auto mt-8 max-w-3xl space-y-8">
        <PaymentSettings settings={settings} />
        <GeneralSettings settings={settings} />
        <EmailSettings settings={settings} />
      </div>
    </div>
  );
}
