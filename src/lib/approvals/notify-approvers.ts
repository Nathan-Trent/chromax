import { sendApprovalRequested } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Fetches workflow approvers by role and queues approval-request emails (non-blocking).
 */
export function voidNotifyApprovalEmailsForWorkflow(
  workflowId: string,
  params: {
    actionType: string;
    recordLabel: string;
    submittedByEmail: string;
    dashboardUrl: string;
  },
): void {
  void (async () => {
    try {
      const service = createServiceRoleClient();
      const { data: wf, error: wErr } = await service
        .from("approval_workflows")
        .select("approver_role_id")
        .eq("id", workflowId)
        .maybeSingle();
      if (wErr || !wf?.approver_role_id) return;

      const { data: members, error: mErr } = await service
        .from("user_roles")
        .select("user_id")
        .eq("role_id", wf.approver_role_id as string);
      if (mErr || !members?.length) return;

      const seen = new Set<string>();
      for (const row of members) {
        const uid = row.user_id as string;
        if (seen.has(uid)) continue;
        seen.add(uid);
        const { data: auth, error: aErr } = await service.auth.admin.getUserById(uid);
        if (aErr || !auth.user?.email) continue;
        void sendApprovalRequested(
          params.recordLabel,
          params.actionType,
          params.submittedByEmail,
          auth.user.email,
          params.dashboardUrl,
        );
      }
    } catch (e) {
      console.warn("[approvals] voidNotifyApprovalEmailsForWorkflow:", e);
    }
  })();
}
