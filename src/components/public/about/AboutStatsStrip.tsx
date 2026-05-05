"use client";

import { useEffect, useRef, useState } from "react";

type StatDef =
  | { kind: "count"; label: string; end: number; suffix: string }
  | { kind: "text"; label: string; value: string };

const STATS: StatDef[] = [
  { kind: "count", label: "Years manufacturing", end: 25, suffix: "+" },
  { kind: "count", label: "Formulations", end: 1000, suffix: "+" },
  { kind: "count", label: "Export countries", end: 4, suffix: "" },
  { kind: "text", label: "Certified", value: "ISO" },
];

function CountCell({
  end,
  suffix,
  run,
}: {
  end: number;
  suffix: string;
  run: boolean;
}) {
  const [val, setVal] = useState(run ? end : 0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!run) return;
    const startT = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startT) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setVal(Math.round(end * eased));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [run, end]);

  return (
    <p className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-[#1a1a2e] md:text-5xl">
      {val.toLocaleString()}
      {suffix}
    </p>
  );
}

export function AboutStatsStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setRun(true));
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-[#E8A020] py-12" ref={containerRef}>
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {STATS.map((s, i) => (
            <div
              key={s.kind === "count" ? `${s.label}-${s.end}` : s.value}
              className={`text-center ${
                i < STATS.length - 1 ? "md:border-r md:border-[#1a1a2e]/15" : ""
              }`}
            >
              {s.kind === "count" ? (
                <CountCell end={s.end} suffix={s.suffix} run={run} />
              ) : (
                <p className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-[#1a1a2e] md:text-5xl">
                  {s.value}
                </p>
              )}
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
