"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Chip =
  | "all"
  | "industrial"
  | "marine"
  | "automotive"
  | "architectural"
  | "custom"
  | "draft"
  | "archived";

const CHIPS: { label: string; value: Chip }[] = [
  { label: "All", value: "all" },
  { label: "Industrial", value: "industrial" },
  { label: "Marine", value: "marine" },
  { label: "Automotive", value: "automotive" },
  { label: "Architectural", value: "architectural" },
  { label: "Custom", value: "custom" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

function activeChip(searchParams: URLSearchParams): Chip {
  const st = searchParams.get("status");
  if (st === "draft" || st === "archived") return st;
  const c = searchParams.get("category");
  if (
    c === "industrial" ||
    c === "marine" ||
    c === "automotive" ||
    c === "architectural" ||
    c === "custom"
  ) {
    return c;
  }
  return "all";
}

function buildHref(searchParams: URLSearchParams, chip: Chip) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  if (chip === "all") {
    params.delete("category");
    params.delete("status");
  } else if (chip === "draft" || chip === "archived") {
    params.set("status", chip);
    params.delete("category");
  } else {
    params.set("category", chip);
    params.delete("status");
  }
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

function chipClass(active: boolean) {
  if (active) {
    return "shrink-0 rounded-full bg-[#1a1a2e] px-4 py-1.5 text-center text-[12px] font-medium text-white transition-colors duration-150";
  }
  return "shrink-0 rounded-full border border-[#E0DED4] bg-white px-4 py-1.5 text-center text-[12px] font-medium text-[#555] transition-colors duration-150 hover:border-[#1a1a2e]";
}

export function ProductAdminFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = activeChip(searchParams);
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
    <div className="mb-6 rounded-xl border border-[#E8E8E4] bg-white px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[#D0D0CA] bg-white px-3.5 py-2.5 font-sans text-sm text-[#333] placeholder:text-[#999] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] lg:w-64"
          aria-label="Search products"
        />
        <div className="flex flex-1 flex-row flex-wrap gap-2 overflow-x-auto pb-1">
          {CHIPS.map(({ label, value }) => (
            <Link
              key={value}
              href={buildHref(searchParams, value)}
              className={chipClass(current === value)}
              scroll={false}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
