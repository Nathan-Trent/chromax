"use client";

import {
  ROLE_PERMISSION_SECTIONS,
  emptyPermissions,
  permissionSectionsSummary,
} from "@/lib/admin/role-permission-matrix";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { Toast } from "@/components/ui/Toast";
import type {
  CustomerDashboardRow,
  PendingInviteRow,
  StaffMemberRow,
} from "@/types/admin-workflows";
import type { Role, RolePermissions } from "@/types/role";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

function IconLock({ className = "inline h-4 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-label="Restricted">
      <rect x={5} y={11} width={14} height={10} rx={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function formatJoined(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function isSuperAdminRole(r: Role): boolean {
  return r.is_system && r.name === "Super Admin";
}

function staffRowSuspended(row: StaffMemberRow): boolean {
  const bt = row.banned_until;
  if (!bt) return false;
  const t = new Date(bt).getTime();
  return Number.isFinite(t) && t > Date.now();
}

type CustomerFilter = "all" | "with_orders" | "no_orders" | "unconfirmed" | "suspended";

export interface UsersRolesClientProps {
  activeStaff: StaffMemberRow[];
  pendingInvites: PendingInviteRow[];
  customers: CustomerDashboardRow[];
  roles: Role[];
  currentUserId: string;
  isSuperAdminViewer: boolean;
}

export function UsersRolesClient({
  activeStaff: initialStaff,
  pendingInvites: initialPending,
  customers: initialCustomers,
  roles: initialRoles,
  currentUserId,
  isSuperAdminViewer,
}: UsersRolesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("staff");
  const [staff, setStaff] = useState(initialStaff);
  const [pending, setPending] = useState(initialPending);
  const [customers, setCustomers] = useState(initialCustomers);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [rolePick, setRolePick] = useState<Record<string, string[]>>({});

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [rolesLocal, setRolesLocal] = useState(initialRoles);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [permState, setPermState] = useState<RolePermissions>(() => emptyPermissions());
  const [roleSaveLoading, setRoleSaveLoading] = useState(false);
  const [viewRole, setViewRole] = useState<Role | null>(null);

  const [suspendModal, setSuspendModal] = useState<
    null | { kind: "staff" | "customer"; id: string; email: string }
  >(null);
  const [suspendReason, setSuspendReason] = useState("");

  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>("all");
  const [customerSearch, setCustomerSearch] = useState("");

  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [deleteCustomerFlow, setDeleteCustomerFlow] = useState<
    null | { id: string; email: string; step: 1 | 2 }
  >(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!isSuperAdminViewer && activeTab === "customers") setActiveTab("staff");
  }, [isSuperAdminViewer, activeTab]);

  useEffect(() => {
    queueMicrotask(() => {
      setStaff(initialStaff);
      setPending(initialPending);
      setCustomers(initialCustomers);
      setRolesLocal(initialRoles);
    });
  }, [initialStaff, initialPending, initialCustomers, initialRoles]);

  const tabs = useMemo(() => {
    const t: { id: string; label: string; count?: number }[] = [
      { id: "staff", label: "Staff" },
      { id: "roles", label: "Roles" },
    ];
    if (isSuperAdminViewer) {
      t.push({ id: "customers", label: "Customers", count: customers.length });
    }
    return t;
  }, [customers.length, isSuperAdminViewer]);

  const assignableRoles = useMemo(
    () => rolesLocal.filter((r) => !isSuperAdminRole(r)),
    [rolesLocal],
  );

  const rolesForTable = useMemo(() => {
    if (isSuperAdminViewer) return rolesLocal;
    return rolesLocal.filter((r) => !isSuperAdminRole(r));
  }, [rolesLocal, isSuperAdminViewer]);

  const roleOptions = useMemo(
    () => assignableRoles.map((r) => ({ value: r.id, label: r.name })),
    [assignableRoles],
  );

  const filteredCustomers = useMemo(() => {
    let list = customers;
    const q = customerSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          (c.full_name ?? "").toLowerCase().includes(q),
      );
    }
    switch (customerFilter) {
      case "with_orders":
        return list.filter((c) => c.order_count > 0);
      case "no_orders":
        return list.filter((c) => c.order_count === 0);
      case "unconfirmed":
        return list.filter((c) => !c.confirmed_at);
      case "suspended":
        return list.filter((c) => Boolean(c.suspended_at));
      default:
        return list;
    }
  }, [customers, customerFilter, customerSearch]);

  function toastOk(msg: string) {
    setSuccessMsg(msg);
    setErr(null);
  }

  async function patchUser(id: string, body: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Request failed");
      return false;
    }
    return true;
  }

  function getChecked(userId: string, roleId: string): boolean {
    const picked = rolePick[userId];
    if (picked) return picked.includes(roleId);
    const u = staff.find((x) => x.id === userId);
    return Boolean(u?.roles.some((r) => r.id === roleId));
  }

  function setChecked(userId: string, roleId: string, on: boolean) {
    const u = staff.find((x) => x.id === userId);
    const base = rolePick[userId] ?? (u?.roles.map((r) => r.id) ?? []);
    const next = new Set(base);
    if (on) next.add(roleId);
    else next.delete(roleId);
    setRolePick((p) => ({ ...p, [userId]: [...next] }));
  }

  async function saveUserRoles(userId: string) {
    setErr(null);
    const u = staff.find((x) => x.id === userId);
    const roleIds = rolePick[userId] ?? (u?.roles.map((r) => r.id) ?? []);
    const res = await fetch(`/api/admin/users/${userId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_ids: roleIds }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Failed to save roles");
      return;
    }
    setOpenUserId(null);
    setRolePick((p) => {
      const n = { ...p };
      delete n[userId];
      return n;
    });
    toastOk("Roles updated.");
    router.refresh();
  }

  async function sendInvite() {
    setErr(null);
    if (!inviteEmail.trim()) {
      setErr("Email is required");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role_id: inviteRoleId || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(json.error ?? "Invite failed");
        return;
      }
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRoleId("");
      toastOk("Invitation sent.");
      router.refresh();
    } finally {
      setInviteLoading(false);
    }
  }

  async function revokePending(inv: PendingInviteRow) {
    if (!window.confirm(`Revoke invitation for ${inv.email}?`)) return;
    setErr(null);
    const res = await fetch(`/api/admin/users/${inv.id}?type=staff`, { method: "DELETE" });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Revoke failed");
      return;
    }
    toastOk("Invitation revoked.");
    router.refresh();
  }

  async function resendPending(inv: PendingInviteRow, roleHint?: string) {
    const roleMeta = rolesLocal.find((r) => roleHint && r.name === roleHint);
    const rid = roleMeta?.id;
    setErr(null);
    const res = await fetch(`/api/admin/users/${inv.id}/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inv.email, role_id: rid ?? undefined }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Resend failed");
      return;
    }
    toastOk("Invitation resent.");
    router.refresh();
  }

  function submitSuspendModal() {
    if (!suspendModal) return;
    const { kind, id, email } = suspendModal;
    const reason = suspendReason.trim() || undefined;

    void (async () => {
      const ok =
        kind === "staff"
          ? await patchUser(id, { action: "suspend", reason })
          : await patchUser(id, { action: "suspend_customer", reason });
      if (ok) {
        toastOk(kind === "staff" ? "Staff member suspended." : "Customer suspended.");
        setSuspendModal(null);
        setSuspendReason("");
        router.refresh();
      }
    })();
  }

  function openCreateRole() {
    setEditingRoleId(null);
    setRoleName("");
    setPermState(emptyPermissions());
    setRoleFormOpen(true);
  }

  function openEditRole(role: Role) {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    const merged = emptyPermissions();
    for (const k of Object.keys(role.permissions ?? {})) {
      const sec = role.permissions[k];
      if (!merged[k]) merged[k] = {};
      for (const ak of Object.keys(sec ?? {})) {
        merged[k][ak] = Boolean(sec[ak]);
      }
    }
    setPermState(merged);
    setRoleFormOpen(true);
  }

  function togglePerm(sectionKey: string, actionKey: string) {
    setPermState((p) => ({
      ...p,
      [sectionKey]: { ...p[sectionKey], [actionKey]: !p[sectionKey]?.[actionKey] },
    }));
  }

  function selectAllSection(sectionKey: string, keys: string[], on: boolean) {
    setPermState((p) => {
      const sec = { ...p[sectionKey] };
      for (const k of keys) sec[k] = on;
      return { ...p, [sectionKey]: sec };
    });
  }

  async function saveRole() {
    setErr(null);
    if (!roleName.trim()) {
      setErr("Role name is required");
      return;
    }
    setRoleSaveLoading(true);
    try {
      if (editingRoleId) {
        const res = await fetch(`/api/admin/roles/${editingRoleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: roleName.trim(), permissions: permState }),
        });
        const json = (await res.json()) as { error?: string; data?: { role: Role } };
        if (!res.ok) {
          setErr(json.error ?? "Update failed");
          return;
        }
        if (json.data?.role) {
          setRolesLocal((rs) => rs.map((r) => (r.id === json.data!.role.id ? json.data!.role : r)));
        }
      } else {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: roleName.trim(), permissions: permState }),
        });
        const json = (await res.json()) as { error?: string; data?: { role: Role } };
        if (!res.ok) {
          setErr(json.error ?? "Create failed");
          return;
        }
        if (json.data?.role) {
          setRolesLocal((rs) => [...rs, json.data!.role].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
      setRoleFormOpen(false);
      toastOk("Role saved.");
      router.refresh();
    } finally {
      setRoleSaveLoading(false);
    }
  }

  async function deleteRole(role: Role) {
    if (!window.confirm("Are you sure? Users with this role will lose these permissions.")) {
      return;
    }
    setErr(null);
    const res = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Delete failed");
      return;
    }
    setRolesLocal((rs) => rs.filter((r) => r.id !== role.id));
    toastOk("Role deleted.");
    router.refresh();
  }

  function customerEmptySubtitle(): string {
    switch (customerFilter) {
      case "with_orders":
        return "No customers with orders match this filter.";
      case "no_orders":
        return "No registered customers without orders.";
      case "unconfirmed":
        return "Everyone currently listed has verified their email.";
      case "suspended":
        return "No suspended customers right now.";
      default:
        return "When shoppers register accounts, they will appear here.";
    }
  }

  function chipClass(on: boolean) {
    return on
      ? "shrink-0 rounded-full bg-[#1a1a2e] px-3 py-1 text-[11px] font-medium text-white transition-colors duration-150"
      : "shrink-0 rounded-full border border-[#E0DED4] bg-white px-3 py-1 text-[11px] font-medium text-[#555] transition-colors duration-150 hover:border-[#1a1a2e]";
  }

  async function saveCustomerNote(customerId: string) {
    setNoteSaving(true);
    setErr(null);
    const ok = await patchUser(customerId, { action: "update_note", note: noteDraft });
    setNoteSaving(false);
    if (!ok) return;
    setNoteEditId(null);
    toastOk("Internal note saved.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}
      {successMsg ? (
        <Toast variant="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />
      ) : null}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {suspendModal ? (
        <Modal
          isOpen
          onClose={() => {
            setSuspendModal(null);
            setSuspendReason("");
          }}
          title={suspendModal.kind === "staff" ? "Suspend staff member" : "Suspend customer"}
        >
          <p className="font-sans text-sm text-[#555]">
            {suspendModal.kind === "staff"
              ? `Suspend ${suspendModal.email}? They will be blocked from signing in.`
              : `Suspend customer ${suspendModal.email}?`}
          </p>
          <label className="mt-4 block font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
            Reason (optional)
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#D0D0CA] px-3 py-2 font-sans text-sm focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuspendModal(null);
                setSuspendReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="border-[#993C1D] text-[#993C1D] hover:bg-[#993C1D]/12"
              variant="outline"
              onClick={() => submitSuspendModal()}
            >
              Confirm suspend
            </Button>
          </div>
        </Modal>
      ) : null}

      {deleteCustomerFlow?.step === 1 ? (
        <Modal isOpen onClose={() => setDeleteCustomerFlow(null)} title="Delete account">
          <p className="font-sans text-sm text-[#555]">
            Delete {deleteCustomerFlow.email}&apos;s account? This will remove their login access and delete
            their stored orders list.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteCustomerFlow(null)}>
              Cancel
            </Button>
            <Button type="button" variant="outline" className="text-[#993C1D]" onClick={() => setDeleteCustomerFlow({ ...deleteCustomerFlow, step: 2 })}>
              Continue
            </Button>
          </div>
        </Modal>
      ) : null}

      {deleteCustomerFlow?.step === 2 ? (
        <Modal isOpen onClose={() => setDeleteCustomerFlow(null)} title="Confirm deletion">
          <p className="font-sans text-sm text-[#555]">Type DELETE to permanently remove this customer account.</p>
          <div className="mt-4">
            <Input
              label=""
              placeholder="DELETE"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteCustomerFlow(null);
                setDeleteConfirmInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={deleteBusy}
              variant="outline"
              className="border-[#993C1D] text-[#993C1D]"
              disabled={deleteConfirmInput !== "DELETE"}
              onClick={() => {
                void (async () => {
                  const id = deleteCustomerFlow!.id;
                  setDeleteBusy(true);
                  const res = await fetch(`/api/admin/users/${id}?type=customer`, { method: "DELETE" });
                  const json = (await res.json()) as { error?: string };
                  setDeleteBusy(false);
                  if (!res.ok) {
                    setErr(json.error ?? "Delete failed");
                    return;
                  }
                  setDeleteCustomerFlow(null);
                  setDeleteConfirmInput("");
                  toastOk("Account deleted.");
                  router.refresh();
                })();
              }}
            >
              Delete account
            </Button>
          </div>
        </Modal>
      ) : null}

      {activeTab === "staff" ? (
        <div role="tabpanel" id="panel-staff" aria-labelledby="tab-staff" className="pt-6 space-y-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {isSuperAdminViewer ? (
              <Button type="button" variant="outline" onClick={() => setInviteOpen(!inviteOpen)}>
                Invite user
              </Button>
            ) : null}
          </div>

          {inviteOpen && isSuperAdminViewer ? (
            <div className="mb-6 rounded-xl border border-[#E8E8E4] bg-white p-5">
              <p className="mb-3 font-sans text-sm font-medium text-[#1a1a2e]">Invite admin user</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input
                  label="Email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Select
                  label="Role on join"
                  options={[{ value: "", label: "None" }, ...roleOptions]}
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                />
                <Button type="button" loading={inviteLoading} onClick={() => void sendInvite()}>
                  Send invite
                </Button>
              </div>
            </div>
          ) : null}

          {pending.length > 0 ? (
            <div className="rounded-xl border border-[#E8E8E4] bg-white">
              <div className="border-b border-[#E8E8E4] px-5 py-3">
                <h3 className="font-sans text-base font-semibold text-[#1a1a2e]">
                  Pending invitations
                </h3>
              </div>
              <div className="overflow-x-auto p-5">
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.HeadCell>Email</Table.HeadCell>
                      <Table.HeadCell>Invited</Table.HeadCell>
                      <Table.HeadCell>Role</Table.HeadCell>
                      <Table.HeadCell>{isSuperAdminViewer ? "Actions" : ""}</Table.HeadCell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {pending.map((inv) => (
                      <Table.Row key={inv.id}>
                        <Table.Cell className="font-mono text-[12px] text-[#1a1a2e]">
                          {inv.email}
                        </Table.Cell>
                        <Table.Cell className="font-sans text-sm text-[#555]">{formatJoined(inv.invited_at)}</Table.Cell>
                        <Table.Cell className="font-sans text-sm text-[#555]">
                          {inv.role_name ?? "—"}
                        </Table.Cell>
                        <Table.Cell>
                          {isSuperAdminViewer ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="rounded-lg border border-[#185FA5] px-2 py-1 font-sans text-xs font-medium text-[#185FA5]"
                                onClick={() => void resendPending(inv, inv.role_name?.split(",")[0]?.trim())}
                              >
                                Resend
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-[#993C1D] px-2 py-1 font-sans text-xs font-medium text-[#993C1D]"
                                onClick={() => void revokePending(inv)}
                              >
                                Revoke
                              </button>
                            </div>
                          ) : null}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Email</Table.HeadCell>
                  <Table.HeadCell>Roles assigned</Table.HeadCell>
                  <Table.HeadCell>Joined</Table.HeadCell>
                  <Table.HeadCell>{isSuperAdminViewer ? "Actions" : ""}</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {staff.map((u) => {
                  const suspended = staffRowSuspended(u);
                  return (
                  <Fragment key={u.id}>
                    <Table.Row className={suspended ? "opacity-60" : undefined}>
                      <Table.Cell className="font-sans text-sm font-medium text-[#1a1a2e]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{u.email}</span>
                          {suspended ? (
                            <Badge variant="amber" size="sm">
                              Suspended
                            </Badge>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="font-sans text-sm text-[#555]">
                        {u.roles.length ? (
                          u.roles.map((r) => r.name).join(", ")
                        ) : (
                          <span className="text-[#888]">No roles</span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="font-sans text-sm text-[#666]">{formatJoined(u.created_at)}</Table.Cell>
                      <Table.Cell>
                        {isSuperAdminViewer ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <button
                              type="button"
                              className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                              onClick={() => setOpenUserId(openUserId === u.id ? null : u.id)}
                            >
                              Manage roles
                            </button>
                            {suspended ? (
                              <button
                                type="button"
                                className="rounded-lg border border-[#0F6E56] px-2 py-1 font-sans text-xs font-medium text-[#0F6E56]"
                                onClick={() =>
                                  void (async () => {
                                    const ok = await patchUser(u.id, { action: "unsuspend" });
                                    if (ok) {
                                      toastOk("Suspension lifted.");
                                      router.refresh();
                                    }
                                  })()
                                }
                              >
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded-lg border border-[#993C1D] px-2 py-1 font-sans text-xs font-medium text-[#993C1D]"
                                onClick={() => setSuspendModal({ kind: "staff", id: u.id, email: u.email })}
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-lg border border-[#1a1a2e]/40 px-2 py-1 font-sans text-xs font-medium text-[#1a1a2e]"
                              onClick={() => {
                                if (
                                  window.confirm(`This will send a password reset email to ${u.email}. Continue?`)
                                ) {
                                  void (async () => {
                                    const ok = await patchUser(u.id, {
                                      action: "force_password_reset",
                                      email: u.email,
                                    });
                                    if (ok) toastOk("Password reset email sent.");
                                    router.refresh();
                                  })();
                                }
                              }}
                            >
                              Reset password
                            </button>
                            {u.id !== currentUserId ? (
                              <button
                                type="button"
                                className="rounded-lg border border-[#993C1D] px-2 py-1 font-sans text-xs font-medium text-[#993C1D]"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete ${u.email}? This cannot be undone.`,
                                    )
                                  ) {
                                    void (async () => {
                                      const res = await fetch(`/api/admin/users/${u.id}?type=staff`, {
                                        method: "DELETE",
                                      });
                                      const json = (await res.json()) as { error?: string };
                                      if (!res.ok) {
                                        setErr(json.error ?? "Delete failed");
                                        return;
                                      }
                                      toastOk("Staff account removed.");
                                      router.refresh();
                                    })();
                                  }
                                }}
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </Table.Cell>
                    </Table.Row>
                    {openUserId === u.id && isSuperAdminViewer ? (
                      <Table.Row key={`${u.id}-panel`}>
                        <Table.Cell colSpan={4} className="bg-[#F5F0E8] p-5">
                          {u.id === currentUserId && isSuperAdminViewer ? (
                            <p className="mb-3 font-sans text-xs text-[#666]">
                              Your Super Admin membership is always kept and is not shown in the checkboxes below.
                            </p>
                          ) : null}
                          <p className="mb-3 font-sans text-[13px] font-medium text-[#1a1a2e]">Assign roles</p>
                          <div className="flex flex-col gap-2">
                            {assignableRoles.map((r) => (
                              <label key={r.id} className="flex items-center gap-2 font-sans text-sm text-[#333]">
                                <input
                                  type="checkbox"
                                  checked={getChecked(u.id, r.id)}
                                  onChange={(e) => setChecked(u.id, r.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-[#CFCFC8]"
                                />
                                {r.name}
                                {r.is_system ? (
                                  <span className="text-[11px] uppercase tracking-wide text-[#888]">system</span>
                                ) : null}
                              </label>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpenUserId(null)}>
                              Cancel
                            </Button>
                            <Button type="button" onClick={() => void saveUserRoles(u.id)}>
                              Save roles
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : null}
                  </Fragment>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        </div>
      ) : null}

      {activeTab === "roles" ? (
        <div role="tabpanel" id="panel-roles" aria-labelledby="tab-roles" className="pt-6">
          {isSuperAdminViewer ? (
            <div className="mb-4">
              <Button type="button" onClick={openCreateRole}>
                Create role
              </Button>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Role name</Table.HeadCell>
                  <Table.HeadCell>Type</Table.HeadCell>
                  <Table.HeadCell>Permissions summary</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {rolesForTable.map((r) => {
                  const lockedSuper = isSuperAdminRole(r);
                  return (
                    <Table.Row key={r.id}>
                      <Table.Cell className="font-sans text-sm font-medium text-[#1a1a2e]">
                        <span className="inline-flex items-center gap-2">
                          {lockedSuper && isSuperAdminViewer ? <IconLock className="text-[#888]" /> : null}
                          {r.name}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="font-sans text-sm text-[#555]">
                        {r.is_system ? "System" : "Custom"}
                      </Table.Cell>
                      <Table.Cell className="max-w-xs font-sans text-xs text-[#888]">
                        {permissionSectionsSummary(r.permissions)}
                      </Table.Cell>
                      <Table.Cell>
                        {lockedSuper && isSuperAdminViewer ? (
                          <button
                            type="button"
                            className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                            onClick={() => setViewRole(r)}
                          >
                            View
                          </button>
                        ) : r.is_system ? (
                          <button
                            type="button"
                            className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                            onClick={() => setViewRole(r)}
                          >
                            View
                          </button>
                        ) : isSuperAdminViewer ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                              onClick={() => openEditRole(r)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="font-sans text-[13px] font-medium text-[#993C1D] hover:underline"
                              onClick={() => void deleteRole(r)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                            onClick={() => setViewRole(r)}
                          >
                            View
                          </button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>

          {roleFormOpen && isSuperAdminViewer ? (
            <div className="mt-6 rounded-xl border border-[#E8E8E4] bg-white p-6">
              <h3 className="font-sans text-lg font-medium text-[#1a1a2e]">
                {editingRoleId ? "Edit role" : "New role"}
              </h3>
              <div className="mt-4 max-w-md">
                <Input label="Role name" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
              </div>
              <div className="mt-6 space-y-6">
                {ROLE_PERMISSION_SECTIONS.map((sec) => (
                  <fieldset key={sec.key} className="rounded-lg border border-[#E8E8E4] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <legend className="font-sans text-[13px] font-semibold text-[#1a1a2e]">{sec.label}</legend>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="font-sans text-xs font-medium text-[#185FA5] hover:underline"
                          onClick={() =>
                            selectAllSection(
                              sec.key,
                              sec.actions.map((a) => a.key),
                              true,
                            )
                          }
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          className="font-sans text-xs font-medium text-[#888] hover:underline"
                          onClick={() =>
                            selectAllSection(
                              sec.key,
                              sec.actions.map((a) => a.key),
                              false,
                            )
                          }
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {sec.actions.map((a) => (
                        <label key={a.key} className="flex items-center gap-2 font-sans text-sm text-[#333]">
                          <input
                            type="checkbox"
                            checked={Boolean(permState[sec.key]?.[a.key])}
                            onChange={() => togglePerm(sec.key, a.key)}
                            className="h-4 w-4 rounded border-[#CFCFC8]"
                          />
                          {a.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setRoleFormOpen(false)}>
                  Close
                </Button>
                <Button type="button" loading={roleSaveLoading} onClick={() => void saveRole()}>
                  Save role
                </Button>
              </div>
            </div>
          ) : null}

          {viewRole ? (
            <div className="mt-6 rounded-xl border border-[#E8E8E4] bg-[#F5F0E8] p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-sans text-lg font-medium text-[#1a1a2e]">{viewRole.name}</h3>
                <button
                  type="button"
                  className="font-sans text-sm text-[#185FA5] hover:underline"
                  onClick={() => setViewRole(null)}
                >
                  Close
                </button>
              </div>
              <p className="mb-2 font-sans text-xs text-[#666]">Read only</p>
              <pre className="max-h-80 overflow-auto rounded-lg bg-white p-4 font-mono text-[11px] text-[#333]">
                {JSON.stringify(viewRole.permissions, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "customers" && isSuperAdminViewer ? (
        <div role="tabpanel" id="panel-customers" aria-labelledby="tab-customers" className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-sans text-lg font-semibold text-[#1a1a2e]">Customers</h3>
            <Badge variant="teal" size="sm">
              {filteredCustomers.length}
            </Badge>
          </div>

          <div className="flex flex-row flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["with_orders", "Active"],
                ["no_orders", "Inactive"],
                ["unconfirmed", "Unconfirmed"],
                ["suspended", "Suspended"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={chipClass(customerFilter === id)}
                onClick={() => setCustomerFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <Input
            label="Search"
            placeholder="Email or name"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />

          {filteredCustomers.length === 0 ? (
            <div className="rounded-xl border border-[#E8E8E4] bg-white py-12 text-center">
              <p className="font-sans text-sm font-medium text-[#1a1a2e]">No customers found</p>
              <p className="mt-1 font-sans text-xs text-[#888]">{customerEmptySubtitle()}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.HeadCell>Name</Table.HeadCell>
                    <Table.HeadCell>Email</Table.HeadCell>
                    <Table.HeadCell>Joined</Table.HeadCell>
                    <Table.HeadCell>Orders</Table.HeadCell>
                    <Table.HeadCell>Status</Table.HeadCell>
                    <Table.HeadCell>Actions</Table.HeadCell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {filteredCustomers.map((c) => {
                    const name = c.full_name?.trim() || "Anonymous";
                    const suspended = Boolean(c.suspended_at);
                    const confirmed = Boolean(c.confirmed_at);
                    const statusLabel = suspended ? (
                      <Badge variant="coral" size="sm">
                        Suspended
                      </Badge>
                    ) : !confirmed ? (
                      <Badge variant="amber" size="sm">
                        Unconfirmed
                      </Badge>
                    ) : (
                      <Badge variant="teal" size="sm">
                        Active
                      </Badge>
                    );
                    return (
                      <Fragment key={c.id}>
                        <Table.Row>
                          <Table.Cell className="font-sans text-sm text-[#1a1a2e]">{name}</Table.Cell>
                          <Table.Cell className="font-mono text-[12px] text-[#333]">{c.email}</Table.Cell>
                          <Table.Cell className="font-sans text-sm text-[#666]">{formatJoined(c.created_at)}</Table.Cell>
                          <Table.Cell>
                            {c.order_count > 0 ? (
                              <Badge variant="teal" size="sm">
                                {c.order_count}
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">
                                0
                              </Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell>{statusLabel}</Table.Cell>
                          <Table.Cell>
                            <div className="flex max-w-xs flex-col gap-2">
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={`/admin/orders?customer=${encodeURIComponent(c.email)}`}
                                  className="rounded-lg border border-[#185FA5] px-2 py-1 font-sans text-xs font-medium text-[#185FA5]"
                                >
                                  View orders
                                </Link>
                                {!confirmed ? (
                                  <button
                                    type="button"
                                    className="rounded-lg border border-[#1a1a2e]/40 px-2 py-1 font-sans text-xs font-medium text-[#1a1a2e]"
                                    onClick={() =>
                                      void (async () => {
                                        const ok = await patchUser(c.id, { action: "verify_email" });
                                        if (ok) toastOk("Email verified successfully.");
                                        router.refresh();
                                      })()
                                    }
                                  >
                                    Verify email
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="rounded-lg border border-[#1a1a2e]/40 px-2 py-1 font-sans text-xs font-medium text-[#1a1a2e]"
                                  onClick={() =>
                                    void (async () => {
                                      const ok = await patchUser(c.id, {
                                        action: "force_password_reset",
                                        email: c.email,
                                      });
                                      if (ok) toastOk("Password reset email sent.");
                                      router.refresh();
                                    })()
                                  }
                                >
                                  Reset password
                                </button>
                                {suspended ? (
                                  <div className="flex flex-col gap-1">
                                    <button
                                      type="button"
                                      className="rounded-lg border border-[#0F6E56] px-2 py-1 font-sans text-xs font-medium text-[#0F6E56]"
                                      onClick={() =>
                                        void (async () => {
                                          const ok = await patchUser(c.id, { action: "unsuspend_customer" });
                                          if (ok) toastOk("Customer unsuspended.");
                                          router.refresh();
                                        })()
                                      }
                                    >
                                      Unsuspend
                                    </button>
                                    {c.suspension_reason ? (
                                      <span className="font-sans text-[10px] text-[#888]">
                                        Reason: {c.suspension_reason}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="rounded-lg border border-[#993C1D] px-2 py-1 font-sans text-xs font-medium text-[#993C1D]"
                                    onClick={() => setSuspendModal({ kind: "customer", id: c.id, email: c.email })}
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="rounded-lg border border-[#1a1a2e]/40 px-2 py-1 font-sans text-xs font-medium text-[#1a1a2e]"
                                  onClick={() => {
                                    setNoteEditId(noteEditId === c.id ? null : c.id);
                                    setNoteDraft(c.internal_notes ?? "");
                                  }}
                                >
                                  {noteEditId === c.id ? "Close note" : "Add note"}
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-[#993C1D] px-2 py-1 font-sans text-xs font-medium text-[#993C1D]"
                                  onClick={() => {
                                    setDeleteCustomerFlow({ id: c.id, email: c.email, step: 1 });
                                    setDeleteConfirmInput("");
                                  }}
                                >
                                  Delete account
                                </button>
                              </div>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                        {noteEditId === c.id ? (
                          <Table.Row>
                            <Table.Cell colSpan={6} className="bg-[#F5F0E8] p-4">
                              <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
                                Internal note (admins only)
                              </p>
                              <textarea
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-[#D0D0CA] px-3 py-2 font-sans text-sm"
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setNoteEditId(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  loading={noteSaving}
                                  onClick={() => void saveCustomerNote(c.id)}
                                >
                                  Save note
                                </Button>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
