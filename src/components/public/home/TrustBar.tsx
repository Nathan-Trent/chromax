"use client";

import { AnimatedStatNumber } from "./AnimatedStatNumber";

export interface TrustBarStat {
  number: string;
  label: string;
}

export interface TrustBarProps {
  stats: TrustBarStat[];
}

export function TrustBar({ stats }: TrustBarProps) {
  const four = stats.slice(0, 4);
  return (
    <section className="bg-[#E8A020] py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-y-0">
          {four.map((s, i) => (
            <div
              key={`${s.label}-${i}`}
              className={[
                "relative px-2 text-center md:px-4",
                i > 0
                  ? "md:before:absolute md:before:left-0 md:before:top-[15%] md:before:h-[70%] md:before:w-px md:before:bg-[rgba(26,26,46,0.2)] md:before:content-['']"
                  : "",
              ].join(" ")}
            >
              <div className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold text-[#1a1a2e]">
                <AnimatedStatNumber value={s.number} />
              </div>
              <p className="mt-1 font-sans text-sm uppercase tracking-wide text-[#1a1a2e]/70">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
