"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type StatusChip = "all" | "pending" | "countered" | "accepted" | "declined" | "expired";
type CurrencyChip = "all" | "NGN" | "USD" | "GBP";

const STATUS_CHIPS: { label: string; value: StatusChip }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Countered", value: "countered" },
  { label: "Accepted", value: "accepted" },
  { label: "Declined", value: "declined" },
  { label: "Expired", value: "expired" },
];

const CURRENCY_CHIPS: { label: string; value: CurrencyChip }[] = [
  { label: "All", value: "all" },
  { label: "NGN", value: "NGN" },
  { label: "USD", value: "USD" },
  { label: "GBP", value: "GBP" },
];

function activeStatus(p: URLSearchParams): StatusChip {
  const s = p.get("status");
  if (
    s === "pending" ||
    s === "countered" ||
    s === "accepted" ||
    s === "declined" ||
    s === "expired"
  )
    return s;
  return "all";
}

function activeCurrency(p: URLSearchParams): CurrencyChip {
  const c = p.get("currency");
  if (c === "NGN" || c === "USD" || c === "GBP") return c;
  return "all";
}

function buildHref(p: URLSearchParams, patch: { status?: StatusChip; currency?: CurrencyChip }) {
  const params = new URLSearchParams(p.toString());
  if (patch.status !== undefined) {
    if (patch.status === "all") params.delete("status");
    else params.set("status", patch.status);
  }
  if (patch.currency !== undefined) {
    if (patch.currency === "all") params.delete("currency");
    else params.set("currency", patch.currency);
  }
  const qs = params.toString();
  return qs ? `/admin/b2b?${qs}` : "/admin/b2b";
}

function chipClass(active: boolean) {
  if (active) {
    return "shrink-0 rounded-full bg-[#1a1a2e] px-4 py-1.5 text-center text-[12px] font-medium text-white transition-colors duration-150";
  }
  return "shrink-0 rounded-full border border-[#E0DED4] bg-white px-4 py-1.5 text-center text-[12px] font-medium text-[#555] transition-colors duration-150 hover:border-[#1a1a2e]";
}

export function B2BAdminFilters() {
  const searchParams = useSearchParams();
  const st = activeStatus(searchParams);
  const cur = activeCurrency(searchParams);

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-[#E8E8E4] bg-white px-4 py-4">
      <div className="flex flex-row flex-wrap gap-2 overflow-x-auto pb-1">
        {STATUS_CHIPS.map(({ label, value }) => (
          <Link
            key={value}
            href={buildHref(searchParams, { status: value })}
            className={chipClass(st === value)}
            scroll={false}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex flex-row flex-wrap gap-2 overflow-x-auto pb-1">
        {CURRENCY_CHIPS.map(({ label, value }) => (
          <Link
            key={value}
            href={buildHref(searchParams, { currency: value })}
            className={chipClass(cur === value)}
            scroll={false}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
