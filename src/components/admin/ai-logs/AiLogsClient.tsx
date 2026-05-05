"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import type { AILeadRow } from "@/types/admin-workflows";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

export interface AiLogsClientProps {
  stats: { total: number; newCount: number; converted: number };
}

function statusVariant(s: string): "blue" | "amber" | "green" | "coral" | "default" {
  if (s === "new") return "blue";
  if (s === "contacted") return "amber";
  if (s === "converted") return "green";
  if (s === "lost") return "coral";
  return "default";
}

function fmtDate(iso: string): string {
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

export function AiLogsClient({ stats }: AiLogsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ status: "all", search: "" });
  const [leads, setLeads] = useState<AILeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [convertLoading, setConvertLoading] = useState<string | null>(null);

  const fetchLeads = useCallback(
    async (p: number, f: { status: string; search: string }) => {
      setLoading(true);
      setErr(null);
      const q = new URLSearchParams();
      q.set("page", String(p));
      q.set("limit", String(limit));
      if (f.status !== "all") q.set("status", f.status);
      if (f.search.trim()) q.set("search", f.search.trim());
      const res = await fetch(`/api/admin/ai-logs?${q.toString()}`);
      const json = (await res.json()) as {
        error?: string;
        data?: { leads: AILeadRow[]; total: number };
      };
      if (!res.ok) {
        setErr(json.error ?? "Failed to load");
        setLeads([]);
        setTotal(0);
      } else {
        setLeads(json.data?.leads ?? []);
        setTotal(json.data?.total ?? 0);
      }
      setLoading(false);
    },
    [limit],
  );

  useEffect(() => {
    queueMicrotask(() => void fetchLeads(page, applied));
  }, [page, applied, fetchLeads]);

  const applyFilters = () => {
    setApplied({ status: statusFilter, search });
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function updateStatus(id: string, status: AILeadRow["status"]) {
    setErr(null);
    const res = await fetch(`/api/admin/ai-logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(json.error ?? "Update failed");
      return;
    }
    void fetchLeads(page, applied);
    router.refresh();
  }

  async function convertToB2b(id: string) {
    setConvertLoading(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/ai-logs/${id}/convert`, { method: "POST" });
      const json = (await res.json()) as { error?: string; data?: { offer_id: string } };
      if (!res.ok) {
        setErr(json.error ?? "Convert failed");
        return;
      }
      if (json.data?.offer_id) {
        router.push(`/admin/b2b/${json.data.offer_id}`);
      }
    } finally {
      setConvertLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
          <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">Total leads</p>
          <p className="mt-1 font-sans text-2xl font-semibold text-[#1a1a2e]">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
          <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">New</p>
          <p className="mt-1 font-sans text-2xl font-semibold text-[#185FA5]">{stats.newCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
          <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">Converted</p>
          <p className="mt-1 font-sans text-2xl font-semibold text-[#1D9E75]">{stats.converted}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[#E8E8E4] bg-white p-5 sm:flex-row sm:items-end">
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "contacted", "converted", "lost"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={[
                "rounded-full px-3 py-1 font-sans text-[13px] font-medium transition-colors",
                statusFilter === s
                  ? "bg-[#1a1a2e] text-white"
                  : "bg-[#F0EAD6] text-[#555] hover:bg-[#E8E4D8]",
              ].join(" ")}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap gap-3 sm:justify-end">
          <input
            type="search"
            placeholder="Email or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-[#D0D0CA] px-3 py-2 font-sans text-sm text-[#333] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          />
          <Button type="button" onClick={applyFilters}>
            Search
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-sans text-sm text-[#666]">
          {total} lead{total !== 1 ? "s" : ""} · Page {page} / {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            className="rounded border border-[#ddd] px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => {
              const np = page - 1;
              setPage(np);
              void fetchLeads(np, applied);
            }}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            className="rounded border border-[#ddd] px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => {
              const np = page + 1;
              setPage(np);
              void fetchLeads(np, applied);
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Company</Table.HeadCell>
              <Table.HeadCell>Interest</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Date</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="py-8 text-center text-sm text-[#888]">
                  Loading…
                </Table.Cell>
              </Table.Row>
            ) : null}
            {!loading && leads.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="py-8 text-center text-sm text-[#888]">
                  No leads.
                </Table.Cell>
              </Table.Row>
            ) : null}
            {!loading
              ? leads.map((lead) => (
                  <Fragment key={lead.id}>
                    <Table.Row>
                      <Table.Cell className="font-sans text-sm text-[#1a1a2e]">
                        {lead.name ?? <span className="text-[#888]">Anonymous</span>}
                      </Table.Cell>
                      <Table.Cell>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-[13px] font-medium text-[#185FA5] hover:underline">
                            {lead.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </Table.Cell>
                      <Table.Cell className="max-w-[140px] truncate font-sans text-sm text-[#555]">
                        {lead.company ?? "—"}
                      </Table.Cell>
                      <Table.Cell className="max-w-[160px] truncate font-sans text-xs text-[#666]">
                        {lead.product_interest ?? "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={statusVariant(lead.status)} size="sm">
                          {lead.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="font-sans text-xs text-[#666]">{fmtDate(lead.created_at)}</Table.Cell>
                      <Table.Cell>
                        <button
                          type="button"
                          className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                          onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                        >
                          View
                        </button>
                      </Table.Cell>
                    </Table.Row>
                    {expanded === lead.id ? (
                      <Table.Row>
                        <Table.Cell colSpan={7} className="bg-[#F5F0E8] p-5">
                          <div className="space-y-3 font-sans text-sm text-[#333]">
                            {lead.project_description ? (
                              <p>
                                <span className="font-semibold">Project: </span>
                                {lead.project_description}
                              </p>
                            ) : null}
                            {lead.conversation_summary ? (
                              <p>
                                <span className="font-semibold">Conversation: </span>
                                {lead.conversation_summary}
                              </p>
                            ) : null}
                            <p>
                              <span className="font-semibold">ERP synced: </span>
                              <Badge variant={lead.erp_synced_at ? "teal" : "default"} size="sm">
                                {lead.erp_synced_at ? "yes" : "no"}
                              </Badge>
                            </p>
                            <div className="max-w-md">
                              <Select
                                label="Status"
                                options={[
                                  { value: "new", label: "New" },
                                  { value: "contacted", label: "Contacted" },
                                  { value: "converted", label: "Converted" },
                                  { value: "lost", label: "Lost" },
                                ]}
                                value={lead.status}
                                onChange={(e) =>
                                  void updateStatus(lead.id, e.target.value as AILeadRow["status"])
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              loading={convertLoading === lead.id}
                              disabled={convertLoading !== null || !lead.email}
                              onClick={() => void convertToB2b(lead.id)}
                            >
                              Convert to B2B offer
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : null}
                  </Fragment>
                ))
              : null}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}
