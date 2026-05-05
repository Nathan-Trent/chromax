"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export type ProductFilterCategory =
  | "industrial"
  | "marine"
  | "automotive"
  | "architectural"
  | "custom";

const FILTERS: { label: string; value: ProductFilterCategory | null }[] = [
  { label: "All", value: null },
  { label: "Industrial", value: "industrial" },
  { label: "Marine", value: "marine" },
  { label: "Automotive", value: "automotive" },
  { label: "Architectural", value: "architectural" },
  { label: "Custom", value: "custom" },
];

function buildProductsHref(
  searchParams: URLSearchParams,
  nextCategory: ProductFilterCategory | null,
) {
  const params = new URLSearchParams(searchParams.toString());

  if (nextCategory === null) {
    params.delete("category");
  } else {
    params.set("category", nextCategory);
  }
  params.delete("page");

  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

function chipClass(active: boolean) {
  if (active) {
    return "shrink-0 rounded-full bg-[#1a1a2e] px-4 py-1.5 text-center text-[12px] font-medium text-white transition-colors duration-150";
  }
  return "shrink-0 rounded-full border border-[#E0DED4] bg-white px-4 py-1.5 text-center text-[12px] font-medium text-[#555] transition-colors duration-150 hover:border-[#1a1a2e]";
}

export function ProductFilters() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("category");
  const activeCategory =
    raw === "industrial" ||
    raw === "marine" ||
    raw === "automotive" ||
    raw === "architectural" ||
    raw === "custom"
      ? raw
      : null;

  return (
    <div className="sticky top-16 z-40 border-b border-[#E0DED4] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-row gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ label, value }) => {
            const active =
              value === null ? activeCategory === null : activeCategory === value;
            return (
              <Link
                key={label}
                href={buildProductsHref(searchParams, value)}
                className={chipClass(active)}
                scroll={false}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
