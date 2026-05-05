"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function stripJsonQuotes(v: unknown): string {
  if (typeof v === "string") return v;
  return "";
}

const CURRENCY_OPTS = [
  { value: "NGN", label: "NGN" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
];

export interface GeneralSettingsProps {
  settings: Record<string, unknown>;
}

export function GeneralSettings({ settings }: GeneralSettingsProps) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  const [siteName, setSiteName] = useState(() => stripJsonQuotes(settings.site_name));
  const [contactEmail, setContactEmail] = useState(() => stripJsonQuotes(settings.contact_email));
  const [defaultCurrency, setDefaultCurrency] = useState(() => {
    const c = stripJsonQuotes(settings.default_currency);
    return c === "NGN" || c === "USD" || c === "GBP" ? c : "NGN";
  });

  async function save() {
    setErr(null);
    setSuccess(null);
    const updates = [
      { key: "site_name", value: siteName.trim() },
      { key: "contact_email", value: contactEmail.trim() },
      { key: "default_currency", value: defaultCurrency },
    ];

    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(json.error ?? "Save failed");
        return;
      }
      setSuccess("Saved successfully.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-6">
      <h2 className="font-sans text-lg font-medium text-[#1a1a2e]">General</h2>
      <p className="mt-1 font-sans text-sm text-[#666]">Site identity and default storefront currency.</p>

      {err ? (
        <div className="mt-4">
          <Toast variant="error" message={err} onDismiss={() => setErr(null)} />
        </div>
      ) : null}
      {success ? (
        <div className="mt-4">
          <Toast variant="success" message={success} onDismiss={() => setSuccess(null)} />
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <Input label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
        <Input
          label="Contact email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
        <Select
          label="Default currency"
          options={CURRENCY_OPTS}
          value={defaultCurrency}
          onChange={(e) => setDefaultCurrency(e.target.value)}
        />

        <Button type="button" loading={loading} disabled={loading} onClick={() => void save()}>
          Save general settings
        </Button>
      </div>
    </section>
  );
}
