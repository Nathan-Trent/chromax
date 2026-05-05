"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const FILTERS: { label: string; value: "guide" | null }[] = [
  { label: "All", value: null },
  { label: "Guides", value: "guide" },
];

function buildBlogHref(searchParams: URLSearchParams, next: "guide" | null) {
  const params = new URLSearchParams(searchParams.toString());
  if (next === null) {
    params.delete("type");
  } else {
    params.set("type", next);
  }
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

function chipClass(active: boolean) {
  if (active) {
    return "shrink-0 rounded-full bg-[#1a1a2e] px-4 py-1.5 text-center text-[12px] font-medium text-white transition-colors duration-150";
  }
  return "shrink-0 rounded-full border border-[#E0DED4] bg-white px-4 py-1.5 text-center text-[12px] font-medium text-[#555555] transition-colors duration-150 hover:border-[#1a1a2e]";
}

export function BlogFilters() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("type");
  const activeType = raw === "guide" ? "guide" : null;

  return (
    <div className="sticky top-16 z-30 border-b border-[#E0DED4] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-row gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ label, value }) => {
            const active =
              value === null ? activeType === null : activeType === value;
            return (
              <Link
                key={label}
                href={buildBlogHref(searchParams, value)}
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
