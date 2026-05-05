import { WorkflowsClient } from "@/components/admin/workflows/WorkflowsClient";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { ApprovalWorkflowRow, PendingChangeRow } from "@/types/admin-workflows";
import type { Role } from "@/types/role";
import { redirect } from "next/navigation";

export default async function AdminWorkflowsPage() {
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
  const userRoles = parseUserRoleRows(userRoleRows ?? []);

  if (!isSuperAdmin(userRoles)) {
    return (
      <div className="p-8">
        <h1 className="mb-2 font-sans text-2xl font-semibold text-[#1a1a2e]">Approval Workflows</h1>
        <p className="font-sans text-[#888888]">Access denied. Super Admin only.</p>
      </div>
    );
  }

  const { data: workflows, error: wErr } = await supabase.from("approval_workflows").select("*").order("action_type");
  if (wErr) {
    throw new Error(wErr.message);
  }

  const { data: roleRows, error: rErr } = await supabase.from("roles").select("*").order("name");
  if (rErr) {
    throw new Error(rErr.message);
  }

  const { data: pendingRows, error: pErr } = await supabase
    .from("pending_changes")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (pErr) {
    throw new Error(pErr.message);
  }

  const service = createServiceRoleClient();
  const pending = await Promise.all(
    (pendingRows ?? []).map(async (row) => {
      const p = row as unknown as PendingChangeRow;
      let submitter_email = "—";
      if (p.submitted_by) {
        const { data, error } = await service.auth.admin.getUserById(p.submitted_by);
        if (!error && data.user?.email) {
          submitter_email = data.user.email;
        }
      }
      return { ...p, submitter_email };
    }),
  );

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Approval Workflows</h1>
      <p className="mt-1 max-w-2xl font-sans text-sm text-[#888888]">
        Configure which actions require approval before taking effect, and who approves them.
      </p>

      <div className="mt-8">
        <WorkflowsClient
          workflows={(workflows ?? []) as unknown as ApprovalWorkflowRow[]}
          roles={roleRows as unknown as Role[]}
          pending={pending}
        />
      </div>
    </div>
  );
}
