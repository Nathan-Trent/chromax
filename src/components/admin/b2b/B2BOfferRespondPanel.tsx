"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import type { B2BOfferCurrency } from "@/types/b2b-offer";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface B2BOfferRespondPanelProps {
  offerId: string;
  offeredPrice: number;
  currency: B2BOfferCurrency;
  minPrice: number | null;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function B2BOfferRespondPanel({
  offerId,
  offeredPrice,
  currency,
  minPrice,
}: B2BOfferRespondPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [showAccept, setShowAccept] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMsg, setCounterMsg] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  const counterNum = Number.parseFloat(counterPrice);
  const counterValid = Number.isFinite(counterNum) && counterNum > 0;
  const aboveMin =
    minPrice == null || !counterValid ? true : counterNum >= Number(minPrice);

  async function postRespond(body: Record<string, unknown>) {
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/b2b/${offerId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        error?: string;
        data?: { pending?: boolean; offer?: unknown };
      };
      if (!res.ok) {
        setErr(json.error ?? "Request failed");
        return;
      }
      if (json.data?.pending === true) {
        setOk("Counter-offer submitted for approval before it is sent to the buyer.");
        router.refresh();
        return;
      }
      setOk("Saved.");
      router.push("/admin/b2b");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {err ? (
        <Toast variant="error" message={err} onDismiss={() => setErr(null)} />
      ) : null}
      {ok ? (
        <Toast variant="info" message={ok} onDismiss={() => setOk(null)} />
      ) : null}

      <div className="space-y-3">
        <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Accept offer
        </p>
        {showAccept ? (
          <div className="rounded-xl border border-[#E8E8E4] bg-[#F5F0E8] p-3">
            <p className="font-sans text-sm text-[#555]">
              Are you sure? This will lock the price and send a payment link to the buyer.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => setShowAccept(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[#0F6E56] text-white hover:bg-[#0a5c48]"
                loading={loading}
                disabled={loading}
                onClick={() => void postRespond({ action: "accept" })}
              >
                Confirm accept at {formatMoney(offeredPrice, currency)}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            className="bg-[#0F6E56] text-white hover:bg-[#0a5c48]"
            disabled={loading}
            onClick={() => setShowAccept(true)}
          >
            Accept at {formatMoney(offeredPrice, currency)}
          </Button>
        )}
      </div>

      <div className="border-t border-[#E8E8E4] pt-4">
        <button
          type="button"
          className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
          onClick={() => setCounterOpen(!counterOpen)}
        >
          {counterOpen ? "Hide counter-offer" : "Counter with a different price"}
        </button>
        {counterOpen ? (
          <div className="mt-3 space-y-3">
            <Input
              label="Counter price"
              type="number"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#333]">
                Message to buyer (optional)
              </label>
              <textarea
                value={counterMsg}
                onChange={(e) => setCounterMsg(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#D0D0CA] px-3.5 py-2.5 font-sans text-sm text-[#333] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </div>
            {minPrice != null ? (
              <p
                className={[
                  "font-sans text-xs font-medium",
                  aboveMin ? "text-[#0F6E56]" : "text-[#A32D2D]",
                ].join(" ")}
              >
                Min: {formatMoney(Number(minPrice), currency)}
                {!aboveMin && counterValid ? " — below internal floor" : null}
              </p>
            ) : null}
            <Button
              type="button"
              disabled={loading || !counterValid}
              loading={loading}
              onClick={() =>
                void postRespond({
                  action: "counter",
                  counter_price: counterNum,
                  message: counterMsg.trim() || undefined,
                })
              }
            >
              Submit counter
            </Button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#E8E8E4] pt-4">
        <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Decline
        </p>
        {showDecline ? (
          <div className="rounded-xl border border-[#E8E8E4] bg-[#F5F0E8] p-3">
            <p className="font-sans text-sm text-[#555]">Decline this offer permanently?</p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => setShowDecline(false)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#993C1D] text-[#5C240F]"
                loading={loading}
                disabled={loading}
                onClick={() => void postRespond({ action: "decline" })}
              >
                Confirm decline
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="border-[#993C1D] text-[#5C240F]"
            disabled={loading}
            onClick={() => setShowDecline(true)}
          >
            Decline offer
          </Button>
        )}
      </div>
    </div>
  );
}
