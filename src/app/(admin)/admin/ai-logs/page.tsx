import { AiLogsClient } from "@/components/admin/ai-logs/AiLogsClient";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminAiLogsPage() {
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

  if (!hasPermission(roles, "ai_leads", "view")) {
    return (
      <div className="p-8">
        <h1 className="mb-2 font-sans text-2xl font-semibold text-[#1a1a2e]">AI Chat Logs &amp; Leads</h1>
        <p className="font-sans text-[#888888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const { count: total } = await supabase.from("ai_leads").select("*", { count: "exact", head: true });
  const { count: newCount } = await supabase
    .from("ai_leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  const { count: converted } = await supabase
    .from("ai_leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "converted");

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">AI Chat Logs &amp; Leads</h1>
      <p className="mt-1 max-w-2xl font-sans text-sm text-[#888888]">
        Conversations and leads captured by the AI chat widget.
      </p>

      <div className="mt-8">
        <AiLogsClient
          stats={{
            total: total ?? 0,
            newCount: newCount ?? 0,
            converted: converted ?? 0,
          }}
        />
      </div>
    </div>
  );
}
