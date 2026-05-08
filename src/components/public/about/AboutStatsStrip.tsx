"use client";

import { AnimatedStatNumber } from "@/components/public/home/AnimatedStatNumber";

export interface AboutStatsStripProps {
  stats: { number: string; label: string }[];
}

export function AboutStatsStrip({ stats }: AboutStatsStripProps) {
  const four = stats.slice(0, 4);

  return (
    <section className="bg-[#E8A020] py-12">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {four.map((s, i) => (
            <div
              key={`${s.label}-${s.number}-${i}`}
              className={`text-center ${
                i < four.length - 1 ? "md:border-r md:border-[#1a1a2e]/15" : ""
              }`}
            >
              <div className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-[#1a1a2e] md:text-5xl">
                <AnimatedStatNumber value={s.number} />
              </div>
              <p className="mt-2 font-sans text-xs font-medium uppercase tracking-wide text-[#1a1a2e]/70">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
