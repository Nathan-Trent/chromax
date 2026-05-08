import { sendApprovalRequested } from "@/lib/email";
import { createNotification, notifySuperAdmins } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications/rules";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { workflowLabelForActionType } from "@/lib/workflows/workflow-action-types";

async function notifySuperAdminsInAppExcludingUserIds(
  excludeUserIds: Set<string>,
  options: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const service = createServiceRoleClient();
    const { data: superRole, error: rErr } = await service
      .from("roles")
      .select("id")
      .eq("name", "Super Admin")
      .eq("is_system", true)
      .maybeSingle();
    if (rErr || !superRole?.id) {
      if (rErr) console.warn("[approvals] super admin role lookup:", rErr.message);
      return;
    }
    const { data: rows, error } = await service.from("user_roles").select("user_id").eq("role_id", superRole.id);
    if (error) {
      console.warn("[approvals] super admin user_roles failed:", error.message);
      return;
    }
    const ids = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))].filter(
      (uid) => !excludeUserIds.has(uid),
    );
    await Promise.all(
      ids.map((userId) =>
        createNotification({
          userId,
          type: options.type,
          title: options.title,
          message: options.message,
          data: options.data,
        }),
      ),
    );
  } catch (e) {
    console.warn("[approvals] notifySuperAdminsInAppExcludingUserIds:", e);
  }
}

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
      const approverUserIdsEmailed = new Set<string>();

      for (const row of members) {
        const uid = row.user_id as string;
        if (seen.has(uid)) continue;
        seen.add(uid);
        const { data: auth, error: aErr } = await service.auth.admin.getUserById(uid);
        if (aErr || !auth.user?.email) continue;
        approverEmails.push(auth.user.email);
        approverUserIdsEmailed.add(uid);
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

      const actionLabel = workflowLabelForActionType(params.actionType);
      await notifySuperAdminsInAppExcludingUserIds(approverUserIdsEmailed, {
        type: NOTIFICATION_TYPES.APPROVAL_PENDING,
        title: "Approval requested",
        message: `Approval requested — ${actionLabel} on ${params.recordLabel} (submitted by ${params.submittedByEmail})`,
        data: {
          record_id: params.recordLabel,
          action_type: params.actionType,
        },
      });
    } catch (e) {
      console.warn("[approvals] voidNotifyApprovalEmailsForWorkflow:", e);
    }
  })();
}
