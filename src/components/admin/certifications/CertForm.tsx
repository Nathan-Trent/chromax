"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import type { LiveProductOption } from "@/lib/supabase/queries/products-admin";
import type { CertificationRow, CertificationType } from "@/types/certification";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TYPE_OPTS: { value: CertificationType; label: string }[] = [
  { value: "iso", label: "ISO" },
  { value: "export_licence", label: "Export Licence" },
  { value: "msds", label: "MSDS" },
  { value: "award", label: "Award" },
  { value: "other", label: "Other" },
];

function Toggle({ on, onToggle, id }: { on: boolean; onToggle: () => void; id: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={[
        "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150",
        on ? "bg-[#1a1a2e]" : "bg-[#E0DED4]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 left-1 block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150",
          on ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export interface CertFormProps {
  cert?: CertificationRow | null;
  mode: "create" | "edit";
  liveProducts: LiveProductOption[];
}

export function CertForm({ cert, mode, liveProducts }: CertFormProps) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  const [name, setName] = useState(cert?.name ?? "");
  const [certType, setCertType] = useState<CertificationType>(cert?.cert_type ?? "iso");
  const [issuing, setIssuing] = useState(cert?.issuing_body ?? "");
  const [issueDate, setIssueDate] = useState(cert?.issue_date?.slice(0, 10) ?? "");
  const [expiryDate, setExpiryDate] = useState(cert?.expiry_date?.slice(0, 10) ?? "");
  const [docUrl, setDocUrl] = useState(cert?.document_url ?? "");
  const [productId, setProductId] = useState(cert?.product_id ?? "");
  const [displayOrder, setDisplayOrder] = useState(String(cert?.display_order ?? 0));
  const [active, setActive] = useState(cert?.active ?? true);

  const productOptions = [
    { value: "", label: "Company-wide (no product)" },
    ...liveProducts.map((p) => ({ value: p.id, label: p.name })),
  ];

  async function submit() {
    setErr(null);
    setSuccess(null);
    if (!name.trim()) {
      setErr("Name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      cert_type: certType,
      issuing_body: issuing.trim() || null,
      issue_date: issueDate.trim() || null,
      expiry_date: expiryDate.trim() || null,
      document_url: docUrl.trim() || null,
      product_id: productId.trim() || null,
      display_order: Number.parseInt(displayOrder, 10) || 0,
      active,
    };

    setLoading(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { data?: { certification?: CertificationRow }; error?: string };
        if (!res.ok) {
          setErr(json.error ?? "Create failed");
          return;
        }
        if (json.data?.certification?.id) {
          router.replace(`/admin/certifications/${json.data.certification.id}`);
          router.refresh();
        }
      } else if (cert) {
        const res = await fetch(`/api/admin/certifications/${cert.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setErr(json.error ?? "Update failed");
          return;
        }
        setSuccess("Saved successfully.");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {err ? <Toast variant="error" message={err} onDismiss={() => setErr(null)} /> : null}
      {success ? (
        <Toast variant="success" message={success} onDismiss={() => setSuccess(null)} />
      ) : null}

      <section className="rounded-xl bg-white p-6">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select
            label="Cert type"
            options={TYPE_OPTS.map((o) => ({ value: o.value, label: o.label }))}
            value={certType}
            onChange={(e) => setCertType(e.target.value as CertificationType)}
          />
          <Input label="Issuing body" value={issuing} onChange={(e) => setIssuing(e.target.value)} />
          <Input label="Issue date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <Input label="Expiry date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          <Input label="Document URL" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
          <Select
            label="Linked product"
            options={productOptions}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
          <Input
            label="Display order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
          <div className="flex items-start gap-3">
            <Toggle id="active" on={active} onToggle={() => setActive(!active)} />
            <label htmlFor="active" className="font-sans text-[13px] font-medium text-[#333]">
              Active
            </label>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-end border-t border-[#E8E8E4] bg-white p-4 lg:left-[240px]">
        <Button type="button" loading={loading} disabled={loading} onClick={() => void submit()}>
          {mode === "create" ? "Add certification" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
