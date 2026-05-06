"use client";

import { ERPConnectionStatus } from "@/components/admin/erp/ERPConnectionStatus";
import { ERPPendingReviews } from "@/components/admin/erp/ERPPendingReviews";
import { ERPSyncSettings } from "@/components/admin/erp/ERPSyncSettings";
import type { ErpOverviewStats } from "@/lib/erp/overview-stats";
import type { ErpSyncLogRow, ErpSyncStats } from "@/components/admin/erp/ErpSyncLogClient";
import { ErpSyncLogClient } from "@/components/admin/erp/ErpSyncLogClient";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TabId = "overview" | "pending" | "log" | "settings";

function tabBtn(active: boolean) {
  return [
    "rounded-lg px-3 py-2 font-sans text-sm font-medium transition-colors duration-150",
    active
      ? "bg-[#1a1a2e] text-white"
      : "bg-white text-[#555555] ring-1 ring-[#E5E5E0] hover:bg-[#F0EAD6]",
  ].join(" ");
}

export function ErpSyncHub(props: {
  erpConnected: boolean;
  isSuperAdmin: boolean;
  overview: ErpOverviewStats;
  initialRows: ErpSyncLogRow[];
  initialStats: ErpSyncStats;
}) {
  const { erpConnected, isSuperAdmin, overview, initialRows, initialStats } = props;
  const [tab, setTab] = useState<TabId>("overview");
  const [ov, setOv] = useState(overview);

  useEffect(() => {
    setOv(overview);
  }, [overview]);

  const refreshOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/erp-sync/overview-stats", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { data?: { overview: ErpOverviewStats } };
      if (json.data?.overview) setOv(json.data.overview);
    } catch {
      /* ignore */
    }
  }, []);

  const tabs: { id: TabId; label: string }[] = erpConnected
    ? [
        { id: "overview", label: "Overview" },
        { id: "pending", label: "Pending Reviews" },
        { id: "log", label: "Sync Log" },
        { id: "settings", label: "Settings" },
      ]
    : [{ id: "overview", label: "Overview" }];

  return (
    <div className="space-y-8">
      {!erpConnected ? null : (
        <div className="flex flex-wrap gap-2 border-b border-[#E8E8E4] pb-3">
          {tabs.map((t) => (
            <button key={t.id} type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === "overview" || !erpConnected ? (
        <div className="space-y-6">
          <ERPConnectionStatus />

          {!erpConnected ? (
            <div className="rounded-xl bg-[#FAEEDA] p-6">
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

          {erpConnected ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Pending reviews", value: String(ov.pendingReviews) },
                  { label: "Auto-applied today", value: String(ov.autoAppliedToday) },
                  { label: "Approved today", value: String(ov.approvedToday) },
                  { label: "Rejected today", value: String(ov.rejectedToday) },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl bg-white p-5">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#888888]">
                      {c.label}
                    </p>
                    <p className="mt-2 font-sans text-xl font-semibold text-[#1a1a2e]">{c.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white p-5">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#888888]">
                  Linked products
                </p>
                <p className="mt-2 font-sans text-sm text-[#555555]">
                  <span className="font-semibold text-[#1a1a2e]">
                    {ov.linkedProducts} of {ov.totalProducts}
                  </span>{" "}
                  products linked to ERP.
                </p>
                <Link
                  href="/admin/products"
                  className="mt-3 inline-block font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                >
                  Manage product links →
                </Link>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {erpConnected && tab === "pending" ? (
        <ERPPendingReviews onCountsChanged={() => void refreshOverview()} />
      ) : null}

      {erpConnected && tab === "log" ? (
        <ErpSyncLogClient
          initialRows={initialRows}
          initialStats={initialStats}
          layout="embedded"
        />
      ) : null}

      {erpConnected && tab === "settings" ? <ERPSyncSettings canEdit={isSuperAdmin} /> : null}
    </div>
  );
}
