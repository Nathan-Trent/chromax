import { AuditLogClient } from "@/components/admin/audit/AuditLogClient";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminAuditLogPage() {
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
  const roles = parseUserRoleRows(userRoleRows ?? []);

  if (!hasPermission(roles, "audit_log", "view")) {
    return (
      <div className="p-8">
        <h1 className="mb-2 font-sans text-2xl font-semibold text-[#1a1a2e]">Audit Log</h1>
        <p className="font-sans text-[#888888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Audit Log</h1>
      <p className="mt-1 font-sans text-sm text-[#888888]">Complete history of all system actions.</p>

      <div className="mt-8">
        <AuditLogClient />
      </div>
    </div>
  );
}
