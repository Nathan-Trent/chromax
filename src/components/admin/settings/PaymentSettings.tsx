"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function stripJsonQuotes(v: unknown): string {
  if (typeof v === "string") return v;
  return "";
}

function coerceBool(v: unknown): boolean {
  return v === true || v === "true";
}

function coerceCurrencyList(v: unknown): Set<string> {
  if (!Array.isArray(v)) {
    return new Set(["NGN", "USD", "GBP"]);
  }
  const s = v.filter((x): x is string => typeof x === "string");
  return new Set(s.length ? s : ["NGN", "USD", "GBP"]);
}

export interface PaymentSettingsProps {
  settings: Record<string, unknown>;
}

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

export function PaymentSettings({ settings }: PaymentSettingsProps) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  const [paystackEnabled, setPaystackEnabled] = useState(() => coerceBool(settings.paystack_enabled));
  const [paystackPub, setPaystackPub] = useState(() => stripJsonQuotes(settings.paystack_public_key));
  const [stripeEnabled, setStripeEnabled] = useState(() => coerceBool(settings.stripe_enabled));
  const [stripePub, setStripePub] = useState(() => stripJsonQuotes(settings.stripe_publishable_key));
  const [curNgn, setCurNgn] = useState(() => coerceCurrencyList(settings.supported_currencies).has("NGN"));
  const [curUsd, setCurUsd] = useState(() => coerceCurrencyList(settings.supported_currencies).has("USD"));
  const [curGbp, setCurGbp] = useState(() => coerceCurrencyList(settings.supported_currencies).has("GBP"));

  async function save() {
    setErr(null);
    setSuccess(null);
    const supported: string[] = [];
    if (curNgn) supported.push("NGN");
    if (curUsd) supported.push("USD");
    if (curGbp) supported.push("GBP");

    const updates = [
      { key: "paystack_enabled", value: paystackEnabled },
      { key: "paystack_public_key", value: paystackPub.trim() },
      { key: "stripe_enabled", value: stripeEnabled },
      { key: "stripe_publishable_key", value: stripePub.trim() },
      { key: "supported_currencies", value: supported },
    ];

    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = (await res.json()) as { error?: string; data?: { updated?: number } };
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
      <h2 className="font-sans text-lg font-medium text-[#1a1a2e]">Payment settings</h2>
      <p className="mt-1 font-sans text-sm text-[#666]">
        Control published payment keys and which gateways are active.
      </p>

      <div className="mt-4 rounded bg-[#FAEEDA] p-3 font-sans text-xs text-[#633806]">
        Secret keys (Paystack secret, Stripe secret, webhook secrets) are managed as environment variables on
        the server. They cannot be set here.
      </div>

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

      <div className="mt-6 space-y-6">
        <div className="flex items-start gap-3">
          <Toggle id="paystack-en" on={paystackEnabled} onToggle={() => setPaystackEnabled(!paystackEnabled)} />
          <label htmlFor="paystack-en" className="font-sans text-[13px] font-medium text-[#333]">
            Paystack enabled
          </label>
        </div>
        <Input
          label="Paystack public key"
          value={paystackPub}
          onChange={(e) => setPaystackPub(e.target.value)}
          type="text"
          helper="Public/publishable key only. Secret key is managed in server environment."
        />

        <div className="flex items-start gap-3">
          <Toggle id="stripe-en" on={stripeEnabled} onToggle={() => setStripeEnabled(!stripeEnabled)} />
          <label htmlFor="stripe-en" className="font-sans text-[13px] font-medium text-[#333]">
            Stripe enabled
          </label>
        </div>
        <Input
          label="Stripe publishable key"
          value={stripePub}
          onChange={(e) => setStripePub(e.target.value)}
          type="text"
          helper="Public/publishable key only. Secret key is managed in server environment."
        />

        <fieldset>
          <legend className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[1.2px] text-[#555]">
            Supported currencies
          </legend>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-[#333]">
              <input
                type="checkbox"
                checked={curNgn}
                onChange={(e) => setCurNgn(e.target.checked)}
                className="h-4 w-4 rounded border-[#CFCFC8] text-[#1a1a2e] focus:ring-[#1a1a2e]"
              />
              NGN
            </label>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-[#333]">
              <input
                type="checkbox"
                checked={curUsd}
                onChange={(e) => setCurUsd(e.target.checked)}
                className="h-4 w-4 rounded border-[#CFCFC8] text-[#1a1a2e] focus:ring-[#1a1a2e]"
              />
              USD
            </label>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-[#333]">
              <input
                type="checkbox"
                checked={curGbp}
                onChange={(e) => setCurGbp(e.target.checked)}
                className="h-4 w-4 rounded border-[#CFCFC8] text-[#1a1a2e] focus:ring-[#1a1a2e]"
              />
              GBP
            </label>
          </div>
        </fieldset>

        <Button type="button" loading={loading} disabled={loading} onClick={() => void save()}>
          Save payment settings
        </Button>
      </div>
    </section>
  );
}
