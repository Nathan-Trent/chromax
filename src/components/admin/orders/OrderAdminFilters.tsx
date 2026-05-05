"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type StatusChip =
  | "all"
  | "new"
  | "confirmed"
  | "packed"
  | "dispatched"
  | "delivered"
  | "cancelled";

type CurrencyChip = "all" | "NGN" | "USD" | "GBP";

const STATUS_CHIPS: { label: string; value: StatusChip }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Packed", value: "packed" },
  { label: "Dispatched", value: "dispatched" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const CURRENCY_CHIPS: { label: string; value: CurrencyChip }[] = [
  { label: "All", value: "all" },
  { label: "NGN", value: "NGN" },
  { label: "USD", value: "USD" },
  { label: "GBP", value: "GBP" },
];

function activeStatus(searchParams: URLSearchParams): StatusChip {
  const s = searchParams.get("status");
  if (
    s === "new" ||
    s === "confirmed" ||
    s === "packed" ||
    s === "dispatched" ||
    s === "delivered" ||
    s === "cancelled"
  ) {
    return s;
  }
  return "all";
}

function activeCurrency(searchParams: URLSearchParams): CurrencyChip {
  const c = searchParams.get("currency");
  if (c === "NGN" || c === "USD" || c === "GBP") return c;
  return "all";
}

function buildHref(
  searchParams: URLSearchParams,
  next: { status?: StatusChip; currency?: CurrencyChip },
) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  if (next.status !== undefined) {
    if (next.status === "all") params.delete("status");
    else params.set("status", next.status);
  }
  if (next.currency !== undefined) {
    if (next.currency === "all") params.delete("currency");
    else params.set("currency", next.currency);
  }
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

function chipClass(active: boolean) {
  if (active) {
    return "shrink-0 rounded-full bg-[#1a1a2e] px-4 py-1.5 text-center text-[12px] font-medium text-white transition-colors duration-150";
  }
  return "shrink-0 rounded-full border border-[#E0DED4] bg-white px-4 py-1.5 text-center text-[12px] font-medium text-[#555] transition-colors duration-150 hover:border-[#1a1a2e]";
}

export function OrderAdminFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const st = activeStatus(searchParams);
  const cur = activeCurrency(searchParams);
  const initialSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    queueMicrotask(() => setSearch(searchParams.get("search") ?? ""));
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      const next = search.trim();
      if (next) params.set("search", next);
      else params.delete("search");
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, pathname, router]);

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-[#E8E8E4] bg-white px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search reference or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[#D0D0CA] bg-white px-3.5 py-2.5 font-sans text-sm text-[#333] placeholder:text-[#999] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] sm:w-64"
          aria-label="Search orders"
        />
      </div>
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
