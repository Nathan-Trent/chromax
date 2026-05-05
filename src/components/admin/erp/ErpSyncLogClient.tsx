"use client";

import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useCallback, useEffect, useState } from "react";

import { ERPConnectionStatus } from "./ERPConnectionStatus";

export type ErpSyncLogRow = {
  id: string;
  event_type: string;
  direction: "dashboard_to_erp" | "erp_to_dashboard";
  source: string;
  record_id: string | null;
  payload: unknown;
  status: "success" | "failed" | "retrying" | "dead_letter";
  attempt_count: number | null;
  error_message: string | null;
  created_at: string;
};

export type ErpSyncStats = {
  total: number;
  successRate: number;
  failed: number;
  lastSync: string | null;
};

type FilterStatus = "all" | "success" | "failed" | "dead_letter";
type FilterDirection = "all" | "dashboard_to_erp" | "erp_to_dashboard";

type Props = {
  initialRows: ErpSyncLogRow[];
  initialStats: ErpSyncStats;
};

function chipClass(active: boolean) {
  return [
    "rounded-lg px-3 py-1.5 font-sans text-xs font-medium transition-colors duration-150",
    active
      ? "bg-[#1a1a2e] text-white"
      : "bg-white text-[#555555] ring-1 ring-[#E5E5E0] hover:bg-[#F0EAD6]",
  ].join(" ");
}

export function ErpSyncLogClient({ initialRows, initialStats }: Props) {
  const [rows, setRows] = useState<ErpSyncLogRow[]>(initialRows);
  const [stats, setStats] = useState(initialStats);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [directionFilter, setDirectionFilter] = useState<FilterDirection>("all");
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(true);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter !== "all") p.set("status", statusFilter);
      if (directionFilter !== "all") p.set("direction", directionFilter);
      const res = await fetch(`/api/admin/erp-sync/log?${p.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { rows: ErpSyncLogRow[]; stats: ErpSyncStats };
      };
      if (json.data?.rows) setRows(json.data.rows);
      if (json.data?.stats) setStats(json.data.stats);
    } finally {
      setLoading(false);
    }
  }, [directionFilter, statusFilter]);

  useEffect(() => {
    queueMicrotask(() => void fetchLog());
  }, [fetchLog]);

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        try {
          const r = await fetch("/api/admin/erp-sync/health", { cache: "no-store" });
          const j = (await r.json()) as { status?: string };
          setShowSetupGuide(j.status !== "ok");
        } catch {
          setShowSetupGuide(true);
        }
      })();
    });
  }, []);

  async function onRetry(id: string) {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/erp-sync/retry/${id}`, { method: "POST" });
      if (res.ok) await fetchLog();
    } finally {
      setRetryingId(null);
    }
  }

  function statusBadge(s: ErpSyncLogRow["status"]) {
    switch (s) {
      case "success":
        return <Badge variant="teal">success</Badge>;
      case "failed":
        return <Badge variant="coral">failed</Badge>;
      case "retrying":
        return <Badge variant="amber">retrying</Badge>;
      case "dead_letter":
        return <Badge variant="navy">dead letter</Badge>;
      default:
        return <Badge>{s}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <ERPConnectionStatus />

      {showSetupGuide ? (
        <div className="mb-6 rounded-xl bg-[#FAEEDA] p-6">
          <h2 className="font-sans text-lg font-medium text-[#633806]">Front Sync module not yet installed</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 font-sans text-sm text-[#555555]">
            <li>Install the Front Sync module in your Laravel ERP</li>
            <li>Add CHROMAX_WEBHOOK_SECRET to ERP .env</li>
            <li>Add CHROMAX_DASHBOARD_WEBHOOK_URL to ERP .env</li>
            <li>Generate a Sanctum API token in the ERP</li>
            <li>Add ERP_BASE_URL and ERP_API_TOKEN to this dashboard&apos;s .env.local</li>
            <li>Run php artisan queue:work in the ERP</li>
          </ol>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total events", value: String(stats.total) },
          { label: "Success rate", value: `${stats.successRate}%` },
          { label: "Failed (incl. dead letter)", value: String(stats.failed) },
          {
            label: "Last sync",
            value: stats.lastSync
              ? new Date(stats.lastSync).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—",
          },
        ].map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#888888]">{c.label}</p>
            <p className="mt-2 font-sans text-xl font-semibold text-[#1a1a2e]">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="font-sans text-xs font-medium text-[#888888]">Status</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["success", "Success"],
              ["failed", "Failed"],
              ["dead_letter", "Dead letter"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={chipClass(statusFilter === v)}
              onClick={() => setStatusFilter(v)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="ml-0 font-sans text-xs font-medium text-[#888888] sm:ml-4">Direction</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["dashboard_to_erp", "To ERP"],
              ["erp_to_dashboard", "From ERP"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={chipClass(directionFilter === v)}
              onClick={() => setDirectionFilter(v)}
            >
              {label}
            </button>
          ))}
        </div>
        {loading ? <span className="font-sans text-xs text-[#888888]">Updating…</span> : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-white">
        {rows.length === 0 ? (
          <div className="p-10 text-center font-sans text-sm text-[#888888]">
            No sync events yet. The ERP sync layer will log all events here once the Front Sync module is installed
            in your ERP.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Time</Table.HeadCell>
                  <Table.HeadCell>Event type</Table.HeadCell>
                  <Table.HeadCell>Direction</Table.HeadCell>
                  <Table.HeadCell>Record ID</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                  <Table.HeadCell>Attempts</Table.HeadCell>
                  <Table.HeadCell align="right">Actions</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell className="whitespace-nowrap font-sans text-xs text-[#555555]">
                      {new Date(row.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Table.Cell>
                    <Table.Cell className="font-mono text-xs text-[#1a1a2e]">{row.event_type}</Table.Cell>
                    <Table.Cell>
                      {row.direction === "dashboard_to_erp" ? (
                        <Badge variant="blue" className="rounded-md">
                          → ERP
                        </Badge>
                      ) : (
                        <Badge variant="green" className="rounded-md">
                          ← Dashboard
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell className="max-w-[140px] truncate font-mono text-xs text-[#555555]">
                      {row.record_id ?? "—"}
                    </Table.Cell>
                    <Table.Cell>{statusBadge(row.status)}</Table.Cell>
                    <Table.Cell className="font-sans text-xs text-[#555555]">
                      {row.attempt_count != null && row.attempt_count > 1 ? row.attempt_count : "—"}
                    </Table.Cell>
                    <Table.Cell align="right">
                      {row.direction === "dashboard_to_erp" &&
                      (row.status === "failed" || row.status === "dead_letter") ? (
                        <button
                          type="button"
                          disabled={retryingId === row.id}
                          className="rounded-lg bg-[#E8A020] px-3 py-1.5 font-sans text-xs font-medium text-[#1a1a2e] transition-opacity disabled:opacity-50"
                          onClick={() => void onRetry(row.id)}
                        >
                          {retryingId === row.id ? "…" : "Retry"}
                        </button>
                      ) : (
                        <span className="text-xs text-[#CCCCCC]">—</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
