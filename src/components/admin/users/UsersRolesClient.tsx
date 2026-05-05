"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { Toast } from "@/components/ui/Toast";
import {
  ROLE_PERMISSION_SECTIONS,
  emptyPermissions,
  permissionSectionsSummary,
} from "@/lib/admin/role-permission-matrix";
import type { UserWithRoles } from "@/types/admin-workflows";
import type { Role, RolePermissions } from "@/types/role";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

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

export interface UsersRolesClientProps {
  users: UserWithRoles[];
  roles: Role[];
  currentUserId: string;
}

export function UsersRolesClient({ users: initialUsers, roles: initialRoles, currentUserId }: UsersRolesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState(initialUsers);
  const [err, setErr] = useState<string | null>(null);
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

  useEffect(() => {
    queueMicrotask(() => {
      setUsers(initialUsers);
      setRolesLocal(initialRoles);
    });
  }, [initialUsers, initialRoles]);

  const roleOptions = useMemo(
    () => rolesLocal.map((r) => ({ value: r.id, label: r.name })),
    [rolesLocal],
  );

  const superAdminRoleId = useMemo(
    () => rolesLocal.find((r) => r.name === "Super Admin" && r.is_system)?.id,
    [rolesLocal],
  );

  function getChecked(userId: string, roleId: string): boolean {
    const picked = rolePick[userId];
    if (picked) return picked.includes(roleId);
    const u = users.find((x) => x.id === userId);
    return Boolean(u?.roles.some((r) => r.id === roleId));
  }

  function setChecked(userId: string, roleId: string, on: boolean) {
    const u = users.find((x) => x.id === userId);
    const base = rolePick[userId] ?? (u?.roles.map((r) => r.id) ?? []);
    const next = new Set(base);
    if (on) next.add(roleId);
    else next.delete(roleId);
    setRolePick((p) => ({ ...p, [userId]: [...next] }));
  }

  async function saveUserRoles(userId: string) {
    setErr(null);
    const u = users.find((x) => x.id === userId);
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
      router.refresh();
    } finally {
      setInviteLoading(false);
    }
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
    setPermState((p) => {
      const next = { ...p, [sectionKey]: { ...p[sectionKey], [actionKey]: !p[sectionKey]?.[actionKey] } };
      return next;
    });
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
      router.refresh();
    } finally {
      setRoleSaveLoading(false);
    }
  }

  async function deleteRole(role: Role) {
    if (
      !window.confirm(
        "Are you sure? Users with this role will lose these permissions.",
      )
    ) {
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
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}

      <Tabs
        tabs={[
          { id: "users", label: "Users" },
          { id: "roles", label: "Roles" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "users" ? (
        <div role="tabpanel" id="panel-users" aria-labelledby="tab-users" className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(!inviteOpen)}>
              Invite user
            </Button>
          </div>

          {inviteOpen ? (
            <div className="mb-6 rounded-xl border border-[#E8E8E4] bg-white p-5">
              <p className="mb-3 font-sans text-sm font-medium text-[#1a1a2e]">Invite admin user</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input label="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
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

          <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Email</Table.HeadCell>
                  <Table.HeadCell>Roles assigned</Table.HeadCell>
                  <Table.HeadCell>Joined</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {users.map((u) => (
                  <Fragment key={u.id}>
                    <Table.Row>
                      <Table.Cell className="font-sans text-sm font-medium text-[#1a1a2e]">{u.email}</Table.Cell>
                      <Table.Cell className="font-sans text-sm text-[#555]">
                        {u.roles.length ? (
                          u.roles.map((r) => r.name).join(", ")
                        ) : (
                          <span className="text-[#888]">No roles</span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="font-sans text-sm text-[#666]">{formatJoined(u.created_at)}</Table.Cell>
                      <Table.Cell>
                        <button
                          type="button"
                          className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                          onClick={() => setOpenUserId(openUserId === u.id ? null : u.id)}
                        >
                          Manage roles
                        </button>
                      </Table.Cell>
                    </Table.Row>
                    {openUserId === u.id ? (
                      <Table.Row key={`${u.id}-panel`}>
                        <Table.Cell colSpan={4} className="bg-[#F5F0E8] p-5">
                          <p className="mb-3 font-sans text-[13px] font-medium text-[#1a1a2e]">Assign roles</p>
                          <div className="flex flex-col gap-2">
                            {rolesLocal.map((r) => (
                              <label key={r.id} className="flex items-center gap-2 font-sans text-sm text-[#333]">
                                <input
                                  type="checkbox"
                                  checked={getChecked(u.id, r.id)}
                                  disabled={
                                    Boolean(
                                      superAdminRoleId &&
                                        r.id === superAdminRoleId &&
                                        u.id === currentUserId &&
                                        getChecked(u.id, r.id),
                                    )
                                  }
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
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      ) : null}

      {activeTab === "roles" ? (
        <div role="tabpanel" id="panel-roles" aria-labelledby="tab-roles" className="pt-6">
          <div className="mb-4">
            <Button type="button" onClick={openCreateRole}>
              Create role
            </Button>
          </div>

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
                {rolesLocal.map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Cell className="font-sans text-sm font-medium text-[#1a1a2e]">{r.name}</Table.Cell>
                    <Table.Cell className="font-sans text-sm text-[#555]">
                      {r.is_system ? "System" : "Custom"}
                    </Table.Cell>
                    <Table.Cell className="max-w-xs font-sans text-xs text-[#888]">
                      {permissionSectionsSummary(r.permissions)}
                    </Table.Cell>
                    <Table.Cell>
                      {r.is_system ? (
                        <button
                          type="button"
                          className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                          onClick={() => setViewRole(r)}
                        >
                          View
                        </button>
                      ) : (
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
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          {roleFormOpen ? (
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
              <p className="mb-2 font-sans text-xs text-[#666]">System role — read only</p>
              <pre className="max-h-80 overflow-auto rounded-lg bg-white p-4 font-mono text-[11px] text-[#333]">
                {JSON.stringify(viewRole.permissions, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
