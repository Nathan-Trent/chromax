"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { WORKFLOW_ACTION_DEFINITIONS } from "@/lib/workflows/workflow-action-types";
import type { ApprovalWorkflowRow, PendingChangeRow } from "@/types/admin-workflows";
import type { Role } from "@/types/role";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type PendingWithSubmitter = PendingChangeRow & { submitter_email: string };

export interface WorkflowsClientProps {
  workflows: ApprovalWorkflowRow[];
  roles: Role[];
  pending: PendingWithSubmitter[];
}

function channelsSummary(ch: unknown): string {
  if (!Array.isArray(ch)) return "—";
  const parts = ch.filter((x): x is string => x === "in_app" || x === "email");
  const labels = parts.map((p) => (p === "in_app" ? "in-app" : "email"));
  return labels.length ? labels.join(", ") : "—";
}

function roleName(roles: Role[], id: string | null): string {
  if (!id) return "—";
  return roles.find((r) => r.id === id)?.name ?? "—";
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function WorkflowsClient({ workflows: initialWorkflows, roles, pending: initialPending }: WorkflowsClientProps) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [pending, setPending] = useState(initialPending);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setWorkflows(initialWorkflows);
      setPending(initialPending);
    });
  }, [initialWorkflows, initialPending]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [draft, setDraft] = useState<{
    action_type: string;
    is_active: boolean;
    approver_role_id: string;
    in_app: boolean;
    email: boolean;
    draft_until_approved: boolean;
  } | null>(null);

  const roleOpts = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name })),
    [roles],
  );

  function openConfigure(actionType: string) {
    const existing = workflows.find((w) => w.action_type === actionType);
    const ch = Array.isArray(existing?.notification_channels)
      ? (existing!.notification_channels as string[])
      : ["in_app", "email"];
    setExpanded(actionType);
    setDraft({
      action_type: actionType,
      is_active: existing?.is_active ?? false,
      approver_role_id: existing?.approver_role_id ?? "",
      in_app: ch.includes("in_app"),
      email: ch.includes("email"),
      draft_until_approved: existing?.draft_until_approved ?? true,
    });
  }

  async function saveWorkflow(actionType: string) {
    if (!draft || draft.action_type !== actionType) return;
    setErr(null);
    const def = WORKFLOW_ACTION_DEFINITIONS.find((d) => d.action_type === actionType);
    const label = def?.label ?? actionType;
    const channels: ("in_app" | "email")[] = [];
    if (draft.in_app) channels.push("in_app");
    if (draft.email) channels.push("email");
    if (channels.length === 0) channels.push("in_app");

    const body = {
      action_type: actionType,
      label,
      approver_role_id: draft.approver_role_id || null,
      notification_channels: channels,
      draft_until_approved: draft.draft_until_approved,
      is_active: draft.is_active,
    };

    const existing = workflows.find((w) => w.action_type === actionType);
    setLoadingId(actionType);
    try {
      if (existing) {
        const res = await fetch(`/api/admin/workflows/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approver_role_id: body.approver_role_id,
            notification_channels: body.notification_channels,
            draft_until_approved: body.draft_until_approved,
            is_active: body.is_active,
            label,
          }),
        });
        const json = (await res.json()) as { error?: string; data?: { workflow: ApprovalWorkflowRow } };
        if (!res.ok) {
          setErr(json.error ?? "Save failed");
          return;
        }
        if (json.data?.workflow) {
          setWorkflows((w) => w.map((x) => (x.id === json.data!.workflow.id ? json.data!.workflow : x)));
        }
      } else {
        const res = await fetch("/api/admin/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as { error?: string; data?: { workflow: ApprovalWorkflowRow } };
        if (!res.ok) {
          setErr(json.error ?? "Save failed");
          return;
        }
        if (json.data?.workflow) {
          setWorkflows((w) => [...w, json.data!.workflow]);
        }
      }
      setExpanded(null);
      setDraft(null);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  async function approve(pendId: string) {
    setErr(null);
    const res = await fetch(`/api/admin/pending/${pendId}/approve`, { method: "POST" });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Approve failed");
      return;
    }
    setPending((p) => p.filter((x) => x.id !== pendId));
    router.refresh();
  }

  async function reject(pendId: string) {
    setErr(null);
    const res = await fetch(`/api/admin/pending/${pendId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: rejectComment }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Reject failed");
      return;
    }
    setRejectingId(null);
    setRejectComment("");
    setPending((p) => p.filter((x) => x.id !== pendId));
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}

      <div>
        {WORKFLOW_ACTION_DEFINITIONS.map((def) => {
          const wf = workflows.find((w) => w.action_type === def.action_type);
          const active = expanded === def.action_type;
          return (
            <div key={def.action_type} className="mb-3 rounded-xl border border-[#E8E8E4] bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-base font-semibold text-[#1a1a2e]">{def.label}</p>
                  <p className="mt-1 font-sans text-sm text-[#666]">{def.description}</p>
                </div>
                <div className="min-w-0 flex-1 font-sans text-sm text-[#555]">
                  {wf?.is_active ? (
                    <p>
                      Approved by:{" "}
                      <span className="font-medium text-[#1a1a2e]">{roleName(roles, wf.approver_role_id)}</span>
                    </p>
                  ) : (
                    <p className="text-[#888]">No approval required</p>
                  )}
                  <p className="mt-1 text-xs text-[#888]">
                    Notifications: {channelsSummary(wf?.notification_channels)}
                  </p>
                </div>
                <div className="shrink-0">
                  <Button type="button" variant="outline" size="sm" onClick={() => openConfigure(def.action_type)}>
                    Configure
                  </Button>
                </div>
              </div>

              {active && draft ? (
                <div className="mt-5 border-t border-[#E8E8E4] pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 font-sans text-sm text-[#333]">
                      <input
                        type="checkbox"
                        checked={draft.is_active}
                        onChange={(e) => setDraft((d) => (d ? { ...d, is_active: e.target.checked } : d))}
                        className="h-4 w-4 rounded border-[#CFCFC8]"
                      />
                      Approval required
                    </label>
                  </div>

                  {draft.is_active ? (
                    <div className="mt-4 space-y-4">
                      <Select
                        label="Approver role"
                        options={[{ value: "", label: "— Select —" }, ...roleOpts]}
                        value={draft.approver_role_id}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, approver_role_id: e.target.value } : d))
                        }
                      />
                      <fieldset>
                        <legend className="mb-2 font-sans text-[11px] font-medium uppercase tracking-wide text-[#555]">
                          Notification channels
                        </legend>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 font-sans text-sm">
                            <input
                              type="checkbox"
                              checked={draft.in_app}
                              onChange={(e) => setDraft((d) => (d ? { ...d, in_app: e.target.checked } : d))}
                              className="h-4 w-4 rounded border-[#CFCFC8]"
                            />
                            In-app
                          </label>
                          <label className="flex items-center gap-2 font-sans text-sm">
                            <input
                              type="checkbox"
                              checked={draft.email}
                              onChange={(e) => setDraft((d) => (d ? { ...d, email: e.target.checked } : d))}
                              className="h-4 w-4 rounded border-[#CFCFC8]"
                            />
                            Email
                          </label>
                        </div>
                      </fieldset>
                      <label className="flex items-center gap-2 font-sans text-sm text-[#333]">
                        <input
                          type="checkbox"
                          checked={draft.draft_until_approved}
                          onChange={(e) =>
                            setDraft((d) =>
                              d ? { ...d, draft_until_approved: e.target.checked } : d,
                            )
                          }
                          className="h-4 w-4 rounded border-[#CFCFC8]"
                        />
                        Hold change in draft until approval granted
                      </label>
                    </div>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      loading={loadingId === def.action_type}
                      onClick={() => void saveWorkflow(def.action_type)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setExpanded(null);
                        setDraft(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-4 font-sans text-xl font-medium text-[#1a1a2e]">Pending approvals</h2>
        {pending.length === 0 ? (
          <p className="font-sans text-sm text-[#888]">No pending items.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#E8E8E4] bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-sans text-sm font-semibold text-[#1a1a2e]">
                      {WORKFLOW_ACTION_DEFINITIONS.find((d) => d.action_type === p.action_type)?.label ??
                        p.action_type}
                    </p>
                    <p className="mt-1 font-sans text-sm text-[#555]">Record: {p.record_label ?? p.record_id}</p>
                    <p className="mt-1 font-sans text-xs text-[#888]">
                      Submitted by {p.submitter_email} · {formatWhen(p.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void approve(p.id)}>
                      Approve
                    </Button>
                    {rejectingId === p.id ? (
                      <div className="flex w-full flex-col gap-2 sm:w-auto">
                        <Input
                          placeholder="Comment (optional)"
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => void reject(p.id)}>
                            Confirm reject
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectComment("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => setRejectingId(p.id)}>
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
