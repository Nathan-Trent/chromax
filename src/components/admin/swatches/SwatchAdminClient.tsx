"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { showConfirm } from "@/components/ui/GlobalAlertDialog";
import { Toast } from "@/components/ui/Toast";
import type {
  ColourSwatchRow,
  LiveProductOption,
} from "@/lib/supabase/queries/products-admin";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const TABS: ColourSwatchRow["category"][] = [
  "automotive",
  "architectural",
  "marine",
  "industrial",
];

const HEX_RE = /^[0-9A-Fa-f]{6}$/;

export function SwatchAdminClient({
  swatches: initialSwatches,
  liveProducts,
}: {
  swatches: ColourSwatchRow[];
  liveProducts: LiveProductOption[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ColourSwatchRow["category"]>("automotive");
  const [swatches, setSwatches] = useState(initialSwatches);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHex, setEditHex] = useState("");
  const [editCode, setEditCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingRow, setLoadingRow] = useState<string | null>(null);

  const [addName, setAddName] = useState("");
  const [addHex, setAddHex] = useState("");
  const [addCode, setAddCode] = useState("");
  const [addProductId, setAddProductId] = useState("");
  const [addOrder, setAddOrder] = useState("0");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const filtered = useMemo(
    () => swatches.filter((s) => s.category === tab),
    [swatches, tab],
  );

  const productOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...liveProducts.map((p) => ({ value: p.id, label: p.name })),
    ],
    [liveProducts],
  );

  function startEdit(row: ColourSwatchRow) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditHex(row.hex);
    setEditCode(row.product_code);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveInline(id: string) {
    if (!HEX_RE.test(editHex)) {
      setError("Hex must be exactly 6 hex characters (no #).");
      return;
    }
    setLoadingRow(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/swatches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          hex: editHex.trim(),
          product_code: editCode.trim(),
        }),
      });
      const json = (await res.json()) as { data?: ColourSwatchRow; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Update failed");
        return;
      }
      if (json.data) {
        setSwatches((prev) => prev.map((s) => (s.id === id ? { ...s, ...json.data } : s)));
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setLoadingRow(null);
    }
  }

  async function toggleActive(row: ColourSwatchRow) {
    setLoadingRow(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/swatches/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      const json = (await res.json()) as { data?: ColourSwatchRow; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Update failed");
        return;
      }
      if (json.data) {
        setSwatches((prev) => prev.map((s) => (s.id === row.id ? { ...s, ...json.data } : s)));
      }
      router.refresh();
    } finally {
      setLoadingRow(null);
    }
  }

  async function softDelete(id: string) {
    const ok = await showConfirm({
      title: "Deactivate swatch",
      message:
        "This will deactivate the swatch. It will be hidden from the Colour Lab until it is activated again.",
      confirmLabel: "Deactivate",
      confirmVariant: "danger",
      icon: "warning",
    });
    if (!ok) return;
    setLoadingRow(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/swatches/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Delete failed");
        return;
      }
      setSwatches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: false } : s)),
      );
      setEditingId(null);
      router.refresh();
    } finally {
      setLoadingRow(null);
    }
  }

  async function addSwatch(e: React.FormEvent) {
    e.preventDefault();
    if (!HEX_RE.test(addHex.trim())) {
      setError("Hex must be exactly 6 hex characters (no #).");
      return;
    }
    setAddSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/swatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          hex: addHex.trim(),
          product_code: addCode.trim(),
          category: tab,
          product_id: addProductId || null,
          display_order: Number.parseInt(addOrder, 10) || 0,
        }),
      });
      const json = (await res.json()) as { data?: ColourSwatchRow; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not create swatch");
        return;
      }
      if (json.data) {
        const linked =
          json.data.product_id ?
            liveProducts.find((p) => p.id === json.data!.product_id)?.name ?? null
          : null;
        setSwatches((prev) => [
          ...prev,
          {
            ...json.data!,
            linked_product_name: linked,
          },
        ]);
        setAddName("");
        setAddHex("");
        setAddCode("");
        setAddProductId("");
        setAddOrder("0");
      }
      router.refresh();
    } finally {
      setAddSubmitting(false);
    }
  }

  const hexPreview = (hex: string) => {
    const ok = HEX_RE.test(hex);
    const col = ok ? `#${hex}` : "#E0DED4";
    return (
      <span
        className="inline-block h-8 w-8 shrink-0 rounded-full border border-[#E0DED4]"
        style={{ backgroundColor: col }}
        aria-hidden
      />
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {error ? (
          <div className="mb-4">
            <Toast variant="error" message={error} onDismiss={() => setError(null)} />
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2 border-b border-[#E8E8E4] pb-3">
          {TABS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTab(c)}
              className={[
                "rounded-full px-4 py-1.5 font-sans text-[12px] font-medium capitalize transition-colors duration-150",
                tab === c ?
                  "bg-[#1a1a2e] text-white"
                : "border border-[#E0DED4] bg-white text-[#555] hover:border-[#1a1a2e]",
              ].join(" ")}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
          <table className="w-full border-collapse text-left font-sans text-[13px]">
            <thead className="bg-[#F5F0E8]">
              <tr>
                <th className="border-b border-[#E0DED4] px-3 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555]">
                  Colour
                </th>
                <th className="border-b border-[#E0DED4] px-3 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555]">
                  Name
                </th>
                <th className="border-b border-[#E0DED4] px-3 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555]">
                  Code
                </th>
                <th className="border-b border-[#E0DED4] px-3 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555]">
                  Product
                </th>
                <th className="border-b border-[#E0DED4] px-3 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555]">
                  Order
                </th>
                <th className="border-b border-[#E0DED4] px-3 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555]">
                  Active
                </th>
                <th className="border-b border-[#E0DED4] px-3 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer odd:bg-white even:bg-[#FAFAF8] hover:bg-[#F0EDE6]"
                  onClick={() => editingId !== row.id && startEdit(row)}
                >
                  <td className="border-b border-[#EEECE6] px-3 py-2 align-middle">
                    {editingId === row.id ?
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {hexPreview(editHex)}
                        <Input
                          value={editHex}
                          onChange={(e) => setEditHex(e.target.value)}
                          inputClassName="font-mono uppercase max-w-[7rem]"
                        />
                      </div>
                    : <div className="flex items-center gap-2">
                        <span
                          className="h-10 w-10 shrink-0 rounded-full border border-[#E0DED4]"
                          style={{ backgroundColor: `#${row.hex}` }}
                        />
                        <span className="font-mono text-xs text-[#555]">{row.hex}</span>
                      </div>
                    }
                  </td>
                  <td className="border-b border-[#EEECE6] px-3 py-2 align-middle">
                    {editingId === row.id ?
                      <div onClick={(e) => e.stopPropagation()}>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                    : row.name}
                  </td>
                  <td className="border-b border-[#EEECE6] px-3 py-2 align-middle">
                    {editingId === row.id ?
                      <div onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          inputClassName="font-mono"
                        />
                      </div>
                    : row.product_code}
                  </td>
                  <td className="border-b border-[#EEECE6] px-3 py-2 align-middle text-[#555]">
                    {row.linked_product_name ?? "None"}
                  </td>
                  <td className="border-b border-[#EEECE6] px-3 py-2 align-middle text-[#888]">
                    <span className="inline-flex items-center gap-1" title="Reorder coming later">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                      {row.display_order}
                    </span>
                  </td>
                  <td className="border-b border-[#EEECE6] px-3 py-2 align-middle">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleActive(row);
                      }}
                      disabled={loadingRow === row.id}
                      className="flex items-center gap-2"
                      aria-label={row.active ? "Active" : "Inactive"}
                    >
                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          row.active ? "bg-[#1D9E75]" : "bg-[#C0BEB6]",
                        ].join(" ")}
                      />
                    </button>
                  </td>
                  <td
                    className="border-b border-[#EEECE6] px-3 py-2 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {editingId === row.id ?
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          loading={loadingRow === row.id}
                          onClick={() => void saveInline(row.id)}
                        >
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    : <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="font-medium text-[#185FA5] hover:underline"
                          onClick={() => startEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="font-medium text-[#A32D2D] hover:underline"
                          onClick={() => void softDelete(row.id)}
                          disabled={loadingRow === row.id}
                        >
                          Delete
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="p-6 text-center font-sans text-sm text-[#888]">No swatches in this category.</p>
          ) : null}
        </div>
      </div>

      <div className="lg:col-span-4">
        <form
          onSubmit={(e) => void addSwatch(e)}
          className="rounded-xl border border-[#E8E8E4] bg-white p-5"
        >
          <h2 className="mb-4 font-sans text-sm font-semibold text-[#1a1a2e]">Add swatch</h2>
          <div className="space-y-4">
            <Input label="Colour name" value={addName} onChange={(e) => setAddName(e.target.value)} required />
            <div>
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                Hex code (no #)
              </label>
              <div className="flex items-center gap-3">
                {hexPreview(addHex)}
                <Input
                  value={addHex}
                  onChange={(e) => setAddHex(e.target.value)}
                  placeholder="E8A020"
                  inputClassName="font-mono uppercase max-w-[8rem]"
                  required
                />
              </div>
            </div>
            <Input label="Product code" value={addCode} onChange={(e) => setAddCode(e.target.value)} required />
            <Select
              label="Category"
              options={TABS.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
              value={tab}
              onChange={(e) => setTab(e.target.value as ColourSwatchRow["category"])}
            />
            <Select
              label="Link to product"
              options={productOptions}
              value={addProductId}
              onChange={(e) => setAddProductId(e.target.value)}
            />
            <Input
              label="Display order"
              type="number"
              value={addOrder}
              onChange={(e) => setAddOrder(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={addSubmitting} disabled={addSubmitting}>
              Add swatch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
