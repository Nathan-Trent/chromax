import { sendApprovalRequested } from "@/lib/email";
import { notifySuperAdmins } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications/rules";
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

      const fallback = async () => {
        await notifySuperAdmins({
          type: NOTIFICATION_TYPES.APPROVAL_PENDING,
          title: "Approval required — no approver configured",
          message: `A change to "${params.recordLabel}" requires approval but no approver is configured for this workflow. Please review in Admin → Workflows.`,
          data: {
            record_id: params.recordLabel,
            action_type: params.actionType,
          },
        });
        console.warn(
          "[approvals] No approvers found for",
          params.actionType,
          "— super admins notified as fallback",
        );
      };

      if (wErr || !wf) return;

      if (!wf.approver_role_id) {
        await fallback();
        return;
      }

      const { data: members, error: mErr } = await service
        .from("user_roles")
        .select("user_id")
        .eq("role_id", wf.approver_role_id as string);

      if (mErr || !members?.length) {
        await fallback();
        return;
      }

      const seen = new Set<string>();
      const approverEmails: string[] = [];

      for (const row of members) {
        const uid = row.user_id as string;
        if (seen.has(uid)) continue;
        seen.add(uid);
        const { data: auth, error: aErr } = await service.auth.admin.getUserById(uid);
        if (aErr || !auth.user?.email) continue;
        approverEmails.push(auth.user.email);
      }

      if (approverEmails.length === 0) {
        await fallback();
        return;
      }

      for (const email of approverEmails) {
        void sendApprovalRequested(
          params.recordLabel,
          params.actionType,
          params.submittedByEmail,
          email,
          params.dashboardUrl,
        );
      }
    } catch (e) {
      console.warn("[approvals] voidNotifyApprovalEmailsForWorkflow:", e);
    }
  })();
}
