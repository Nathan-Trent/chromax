import { SessionExpiryWatcher } from "@/components/SessionExpiryWatcher";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlobalAlertDialog } from "@/components/ui/GlobalAlertDialog";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = String(claimsData.claims.sub);
  let email: string | undefined =
    typeof claimsData.claims.email === "string" ? claimsData.claims.email : undefined;

  if (!email) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
  }

  if (!email) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(
      `
      roles (
        id,
        name,
        description,
        permissions,
        is_system
      )
    `,
    )
    .eq("user_id", userId);

  const roles = parseUserRoleRows(userRoleRows ?? []);

  const superUser = isSuperAdmin(roles);
  const userRoleIds = new Set(roles.map((r) => r.id));

  const { data: workflowRows } = await supabase.from("approval_workflows").select("approver_role_id, action_type");

  const approverMatchedWorkflows = (workflowRows ?? []).filter(
    (w) => w.approver_role_id != null && userRoleIds.has(w.approver_role_id as string),
  );
  const allowedApproverActionTypes = [...new Set(approverMatchedWorkflows.map((w) => w.action_type as string))];
  const showApprovalsNav = superUser || approverMatchedWorkflows.length > 0;

  let approvalsPendingCount = 0;
  if (showApprovalsNav) {
    if (superUser) {
      const { count, error: cErr } = await supabase
        .from("pending_changes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (!cErr) approvalsPendingCount = count ?? 0;
    } else if (allowedApproverActionTypes.length > 0) {
      const { count, error: cErr } = await supabase
        .from("pending_changes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .in("action_type", allowedApproverActionTypes);
      if (!cErr) approvalsPendingCount = count ?? 0;
    }
  }

  return (
    <>
      <SessionExpiryWatcher />
      <GlobalAlertDialog />
      <AdminShell
        user={{ id: userId, email }}
        roles={roles}
        approvalsNav={{ show: showApprovalsNav, pendingCount: approvalsPendingCount }}
      >
        {children}
      </AdminShell>
    </>
  );
}
