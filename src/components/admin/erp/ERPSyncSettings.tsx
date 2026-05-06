"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { useCallback, useEffect, useState } from "react";

type SettingRow = {
  id: string;
  event_type: string;
  label: string;
  auto_sync: boolean;
  undo_window_hours: number;
  is_active: boolean;
};

function Toggle({
  on,
  onToggle,
  disabled,
  id,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className={[
        "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150 motion-reduce:transition-none",
        disabled ? "cursor-not-allowed opacity-50" : "",
        on ? "bg-[#1a1a2e]" : "bg-[#E0DED4]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 left-1 block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 motion-reduce:transition-none",
          on ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

const DESCRIPTIONS: Record<string, string> = {
  "stock.updated": "When ERP sends a new quantity for a linked product.",
  "stock.low_threshold": "Low-stock alerts pushed from the ERP.",
  "order.created": "Orders created in the ERP and mirrored to the dashboard.",
  "order.status_updated": "Fulfilment status updates from the ERP.",
  "product.updated": "Non-price field updates from the ERP (prices are never synced).",
  "payment.confirmed": "Payment confirmation events from the ERP.",
  "b2b_offer.accepted": "When an offer is accepted in the ERP pipeline.",
  "lead.captured": "AI / web lead capture events forwarded from the ERP module.",
};

export function ERPSyncSettings({
  canEdit,
}: {
  /** Super admin only */
  canEdit: boolean;
}) {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Partial<SettingRow>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/erp-sync/settings", { cache: "no-store" });
      const json = (await res.json()) as { data?: { settings: SettingRow[] }; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load");
        return;
      }
      setRows(json.data?.settings ?? []);
      setDraft({});
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function rowState(r: SettingRow): SettingRow {
    return { ...r, ...(draft[r.event_type] ?? {}) };
  }

  async function saveRow(eventType: string) {
    if (!canEdit) return;
    const r = rows.find((x) => x.event_type === eventType);
    if (!r) return;
    const d = rowState(r);
    setSaving(eventType);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/erp-sync/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          auto_sync: d.auto_sync,
          undo_window_hours: d.undo_window_hours,
          is_active: d.is_active,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Save failed");
        return;
      }
      setOk("Settings updated");
      setDraft((prev) => {
        const next = { ...prev };
        delete next[eventType];
        return next;
      });
      await load();
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <p className="font-sans text-sm text-[#888888]">Loading settings…</p>;
  }

  return (
    <div>
      {error ? (
        <div className="mb-4">
          <Toast variant="error" message={error} onDismiss={() => setError(null)} />
        </div>
      ) : null}
      {ok ? (
        <div className="mb-4">
          <Toast variant="success" message={ok} onDismiss={() => setOk(null)} />
        </div>
      ) : null}
      <div className="mb-6">
        <h2 className="font-sans text-lg font-medium text-[#1a1a2e]">Sync behaviour settings</h2>
        <p className="mt-1 font-sans text-sm text-[#888888]">
          Configure how each type of ERP sync event is handled.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E8E8E4] bg-white">
        <div className="divide-y divide-[#F0EDE6]">
          {rows.map((r) => {
            const st = rowState(r);
            const desc = DESCRIPTIONS[r.event_type] ?? r.event_type;
            return (
              <div key={r.id} className="p-5">
                <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                  <div className="lg:col-span-4">
                    <p className="font-sans text-[14px] font-medium text-[#1a1a2e]">{r.label}</p>
                    <p className="mt-1 font-sans text-xs text-[#888888]">{desc}</p>
                  </div>
                  <div className="flex flex-col gap-4 lg:col-span-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <Toggle
                        id={`auto-${r.event_type}`}
                        disabled={!canEdit}
                        on={st.auto_sync}
                        onToggle={() =>
                          setDraft((prev) => ({
                            ...prev,
                            [r.event_type]: {
                              ...prev[r.event_type],
                              auto_sync: !st.auto_sync,
                            },
                          }))
                        }
                      />
                      <div>
                        <p className="font-sans text-[13px] font-medium text-[#333]">
                          {st.auto_sync ? "Auto-apply" : "Manual review required"}
                        </p>
                        <p className="font-sans text-xs text-[#888888]">
                          {st.auto_sync
                            ? "Changes apply immediately and are logged for undo."
                            : "Changes wait for approval in Pending Reviews."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-32">
                        <Input
                          label="Undo window"
                          type="number"
                          disabled={!canEdit}
                          value={String(st.undo_window_hours)}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [r.event_type]: {
                                ...prev[r.event_type],
                                undo_window_hours: Number.parseInt(e.target.value, 10) || 0,
                              },
                            }))
                          }
                        />
                      </div>
                      <span className="mb-2 font-sans text-sm text-[#888888]">hours</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Toggle
                        id={`active-${r.event_type}`}
                        disabled={!canEdit}
                        on={st.is_active}
                        onToggle={() =>
                          setDraft((prev) => ({
                            ...prev,
                            [r.event_type]: {
                              ...prev[r.event_type],
                              is_active: !st.is_active,
                            },
                          }))
                        }
                      />
                      <div>
                        <p className="font-sans text-[13px] font-medium text-[#333]">Active</p>
                        <p className="font-sans text-xs text-[#888888]">
                          If off, events are received and logged but not processed or notified.
                        </p>
                      </div>
                    </div>
                    {canEdit ? (
                      <div>
                        <Button
                          type="button"
                          size="sm"
                          loading={saving === r.event_type}
                          disabled={saving !== null}
                          onClick={() => void saveRow(r.event_type)}
                        >
                          Save row
                        </Button>
                      </div>
                    ) : (
                      <p className="font-sans text-xs text-[#888888]">Super admin can edit settings.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
