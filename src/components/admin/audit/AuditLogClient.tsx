"use client";

import { AuditLogFilters } from "@/components/admin/audit/AuditLogFilters";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import type { AuditLogRow } from "@/types/admin-workflows";
import { Fragment, useCallback, useEffect, useState } from "react";

function fmtTime(iso: string): string {
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

function trunc(s: string | null, n: number): string {
  if (!s) return "—";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function sourceVariant(s: string): "blue" | "amber" | "purple" | "default" {
  if (s === "dashboard") return "blue";
  if (s === "erp") return "amber";
  if (s === "ai") return "purple";
  return "default";
}

function jsonBlock(label: string, v: unknown): string {
  if (v == null) return `${label}: —`;
  try {
    return `${label}:\n${JSON.stringify(v, null, 2)}`;
  } catch {
    return `${label}: [unserializable]`;
  }
}

function approvalFromValues(v: unknown): unknown {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  return o.approval_chain ?? null;
}

export function AuditLogClient() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [section, setSection] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [applied, setApplied] = useState({
    search: "",
    source: "",
    section: "",
    startDate: "",
    endDate: "",
  });

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (p: number, filters: typeof applied) => {
      setLoading(true);
      setErr(null);
      const q = new URLSearchParams();
      q.set("page", String(p));
      q.set("limit", String(limit));
      if (filters.search.trim()) q.set("search", filters.search.trim());
      if (filters.source) q.set("source", filters.source);
      if (filters.section) q.set("section", filters.section);
      if (filters.startDate) q.set("start_date", filters.startDate);
      if (filters.endDate) q.set("end_date", filters.endDate);

      const res = await fetch(`/api/admin/audit-log?${q.toString()}`);
      const json = (await res.json()) as {
        error?: string;
        data?: { logs: AuditLogRow[]; total: number };
      };
      if (!res.ok) {
        setErr(json.error ?? "Failed to load");
        setLogs([]);
        setTotal(0);
      } else {
        setLogs(json.data?.logs ?? []);
        setTotal(json.data?.total ?? 0);
      }
      setLoading(false);
    },
    [limit],
  );

  useEffect(() => {
    queueMicrotask(() =>
      void fetchLogs(1, {
        search: "",
        source: "",
        section: "",
        startDate: "",
        endDate: "",
      }),
    );
  }, [fetchLogs]);

  const apply = () => {
    const next = {
      search,
      source,
      section,
      startDate,
      endDate,
    };
    setApplied(next);
    setPage(1);
    void fetchLogs(1, next);
  };

  function exportCsv() {
    const headers = ["created_at", "user_email", "action_type", "section", "record_label", "source"];
    const lines = [headers.join(",")];
    for (const row of logs) {
      const cells = headers.map((h) => {
        const v = row[h as keyof AuditLogRow];
        const s = v == null ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      });
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}

      <AuditLogFilters
        search={search}
        source={source}
        section={section}
        startDate={startDate}
        endDate={endDate}
        onSearchChange={setSearch}
        onSourceChange={setSource}
        onSectionChange={setSection}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={apply}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={exportCsv}
          disabled={!logs.length}
          className="rounded-lg border border-[#1a1a2e] px-4 py-2 font-sans text-[13px] font-medium text-[#1a1a2e] disabled:opacity-50"
        >
          Export CSV
        </button>
        <div className="flex items-center gap-2 font-sans text-sm text-[#666]">
          <button
            type="button"
            disabled={page <= 1 || loading}
            className="rounded border border-[#ddd] px-2 py-1 disabled:opacity-50"
            onClick={() => {
              const np = page - 1;
              setPage(np);
              void fetchLogs(np, applied);
            }}
          >
            Previous
          </button>
          <span>
            Page {page} / {totalPages} ({total} rows)
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            className="rounded border border-[#ddd] px-2 py-1 disabled:opacity-50"
            onClick={() => {
              const np = page + 1;
              setPage(np);
              void fetchLogs(np, applied);
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
              <Table.HeadCell>Time</Table.HeadCell>
              <Table.HeadCell>User</Table.HeadCell>
              <Table.HeadCell>Action</Table.HeadCell>
              <Table.HeadCell>Section</Table.HeadCell>
              <Table.HeadCell>Record</Table.HeadCell>
              <Table.HeadCell>Source</Table.HeadCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="py-8 text-center font-sans text-sm text-[#888]">
                  Loading…
                </Table.Cell>
              </Table.Row>
            ) : null}
            {!loading && logs.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="py-8 text-center font-sans text-sm text-[#888]">
                  No entries.
                </Table.Cell>
              </Table.Row>
            ) : null}
            {!loading
              ? logs.map((row) => (
                  <Fragment key={row.id}>
                    <Table.Row onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                      <Table.Cell className="font-mono text-[11px] text-[#666]">{fmtTime(row.created_at)}</Table.Cell>
                      <Table.Cell className="font-sans text-xs text-[#555]">{trunc(row.user_email, 28)}</Table.Cell>
                      <Table.Cell className="font-mono text-xs text-[#333]">{trunc(row.action_type, 40)}</Table.Cell>
                      <Table.Cell>
                        <Badge variant="default" size="sm">
                          {row.section}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="font-sans text-xs text-[#555]">
                        {trunc(row.record_label, 32)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={sourceVariant(row.source)} size="sm">
                          {row.source}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                    {expanded === row.id ? (
                      <Table.Row key={`${row.id}-ex`}>
                        <Table.Cell colSpan={6} className="bg-[#F5F0E8] p-4">
                          <pre className="max-h-60 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[#333]">
                            {jsonBlock("before_values", row.before_values)}
                            {"\n\n"}
                            {jsonBlock("after_values", row.after_values)}
                            {row.ip_address ? `\n\nip_address:\n${row.ip_address}` : ""}
                            {approvalFromValues(row.after_values) || approvalFromValues(row.before_values)
                              ? `\n\napproval_chain:\n${JSON.stringify(
                                  approvalFromValues(row.after_values) ?? approvalFromValues(row.before_values),
                                  null,
                                  2,
                                )}`
                              : ""}
                          </pre>
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
