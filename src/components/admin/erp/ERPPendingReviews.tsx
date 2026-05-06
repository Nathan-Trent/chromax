"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { showConfirm } from "@/components/ui/GlobalAlertDialog";
import { Toast } from "@/components/ui/Toast";
import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Chip = "all" | "stock" | "orders" | "products" | "other";

type PendingItem = {
  id: string;
  event_type: string;
  direction: string;
  field_changed: string | null;
  status: string;
  current_value: unknown;
  incoming_value: unknown;
  created_at: string;
  dashboard_product_name: string | null;
  payload?: Record<string, unknown> | null;
};

function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatValue(field: string | null, v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if (field === "stock" && typeof o.stock === "number") return `Stock: ${o.stock} units`;
    if (field === "status" && typeof o.status === "string") return `Status: ${o.status}`;
    if (field === "payment_status" && typeof o.payment_status === "string")
      return `Payment: ${o.payment_status}`;
    return Object.entries(o)
      .map(([k, val]) => `${k}: ${val === null || typeof val === "object" ? JSON.stringify(val) : String(val)}`)
      .join(" · ");
  }
  return String(v);
}

function chipMatches(chip: Chip, eventType: string): boolean {
  if (chip === "all") return true;
  if (chip === "stock")
    return eventType.startsWith("stock.") || eventType.includes("stock");
  if (chip === "orders")
    return (
      eventType.startsWith("order.") ||
      eventType.startsWith("payment.") ||
      eventType.includes("order")
    );
  if (chip === "products") return eventType.startsWith("product.");
  return (
    !chipMatches("stock", eventType) &&
    !chipMatches("orders", eventType) &&
    !chipMatches("products", eventType)
  );
}

export function ERPPendingReviews({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<Chip>("all");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [undoWindows, setUndoWindows] = useState<Record<string, number>>({});

  const loadUndoSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/erp-sync/settings", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { settings: { event_type: string; undo_window_hours: number }[] };
      };
      const map: Record<string, number> = {};
      for (const s of json.data?.settings ?? []) {
        map[s.event_type] = s.undo_window_hours;
      }
      setUndoWindows(map);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/erp-sync/pending?status=pending", { cache: "no-store" });
      const json = (await res.json()) as { data?: { items: PendingItem[] }; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load");
        return;
      }
      setItems(json.data?.items ?? []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUndoSettings();
  }, [loadUndoSettings]);

  useEffect(() => {
    void fetchPending();
  }, [fetchPending]);

  const filtered = useMemo(
    () => items.filter((i) => chipMatches(chip, i.event_type)),
    [items, chip],
  );

  async function onApprove(item: PendingItem) {
    const undoH = undoWindows[item.event_type] ?? 24;
    const ok = await showConfirm({
      title: "Approve this sync change?",
      message: `This will update ${item.field_changed ?? "data"} from ${formatValue(item.field_changed, item.current_value)} to ${formatValue(item.field_changed, item.incoming_value)}. This action can be undone within ${undoH} hours.`,
      confirmLabel: "Approve",
      cancelLabel: "Cancel",
      confirmVariant: "teal",
      icon: "info",
    });
    const res = await fetch(`/api/admin/erp-sync/pending/${item.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Approve failed");
      return;
    }
    setToast("Change approved");
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    onCountsChanged?.();
  }

  async function onReject(item: PendingItem) {
    const ok = await showConfirm({
      title: "Reject this sync change?",
      message:
        "The incoming change will be discarded. The current value stays as-is.",
      confirmLabel: "Reject",
      cancelLabel: "Cancel",
      confirmVariant: "danger",
      icon: "warning",
    });
    const res = await fetch(`/api/admin/erp-sync/pending/${item.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Reject failed");
      return;
    }
    setToast("Change rejected");
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    onCountsChanged?.();
  }

  function chipClass(active: boolean) {
    return [
      "rounded-lg px-3 py-1.5 font-sans text-xs font-medium transition-colors duration-150",
      active
        ? "bg-[#1a1a2e] text-white"
        : "bg-white text-[#555555] ring-1 ring-[#E5E5E0] hover:bg-[#F0EAD6]",
    ].join(" ");
  }

  if (loading) {
    return <p className="font-sans text-sm text-[#888888]">Loading pending reviews…</p>;
  }

  return (
    <div>
      {toast ? (
        <div className="mb-4">
          <Toast variant="success" message={toast} onDismiss={() => setToast(null)} />
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Toast variant="error" message={error} onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "All pending"],
            ["stock", "Stock"],
            ["orders", "Orders"],
            ["products", "Products"],
            ["other", "Other"],
          ] as const
        ).map(([v, label]) => (
          <button key={v} type="button" className={chipClass(chip === v)} onClick={() => setChip(v)}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-10 text-center">
          <Check className="mx-auto mb-3 h-10 w-10 text-[#0F6E56]" aria-hidden />
          <p className="font-sans text-base font-medium text-[#1a1a2e]">No pending sync reviews</p>
          <p className="mt-1 font-sans text-sm text-[#888888]">All sync events have been reviewed.</p>
        </div>
      ) : (
        filtered.map((item) => {
          const pname =
            (typeof item.payload?.erp_product_name === "string"
              ? item.payload.erp_product_name
              : null) ?? item.dashboard_product_name;
          return (
            <div
              key={item.id}
              className="mb-3 rounded-xl border-l-4 border-[#E8A020] bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <Badge variant="navy" size="sm" className="rounded-md font-mono">
                  {item.event_type}
                </Badge>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-xs text-[#888888]">{timeAgo(item.created_at)}</span>
                  <Badge variant={item.direction === "dashboard_to_erp" ? "blue" : "green"} size="sm">
                    {item.direction === "dashboard_to_erp" ? "→ ERP" : "← Dashboard"}
                  </Badge>
                </div>
              </div>
              {pname ? (
                <p className="mb-2 font-sans text-sm text-[#555555]">
                  Product: <span className="font-medium text-[#1a1a2e]">{pname}</span>
                </p>
              ) : null}
              {item.dashboard_product_name && item.dashboard_product_name !== pname ? (
                <p className="mb-3 font-sans text-xs text-[#888888]">
                  Linked to: {item.dashboard_product_name}
                </p>
              ) : null}

              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="rounded-lg bg-[#F5F0E8] p-3">
                  <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888888]">
                    Current value
                  </p>
                  <p className="mt-1 font-sans text-sm text-[#555555]">
                    {formatValue(item.field_changed, item.current_value)}
                  </p>
                </div>
                <span className="hidden text-center font-sans text-lg text-[#888888] md:block" aria-hidden>
                  →
                </span>
                <div className="rounded-lg bg-[#FAEEDA] p-3">
                  <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#BA7517]">
                    Incoming change
                  </p>
                  <p className="mt-1 font-sans text-sm text-[#633806]">
                    {formatValue(item.field_changed, item.incoming_value)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void onApprove(item)}>
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#993C1D] text-[#993C1D]"
                  onClick={() => void onReject(item)}
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
