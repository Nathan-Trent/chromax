"use client";

import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import type { HomepageContent } from "@/lib/content/homepage";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const FALLBACK_PALETTE = [
  "#185FA5",
  "#0F6E56",
  "#993C1D",
  "#BA7517",
  "#534AB7",
  "#E8A020",
  "#1a1a2e",
  "#2D2D4E",
];

export type ColourLabCTASectionProps = {
  content: Pick<
    HomepageContent,
    "colourlab_label" | "colourlab_heading" | "colourlab_body" | "colourlab_cta"
  >;
  swatchColours: string[];
};

function normaliseHex(h: string): string {
  const t = h.trim().replace(/^#/, "");
  return t.length === 6 ? `#${t}` : "#185FA5";
}

function initialGrid(palette: string[]): string[] {
  return Array.from({ length: 48 }, () => palette[Math.floor(Math.random() * palette.length)]!);
}

function ColourLabSwatchGrid({ palette }: { palette: string[] }) {
  const [grid, setGrid] = useState(() => initialGrid(palette));

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const id = window.setInterval(() => {
      setGrid((prev) => {
        const next = [...prev];
        const i = Math.floor(Math.random() * 48);
        next[i] = palette[Math.floor(Math.random() * palette.length)]!;
        return next;
      });
    }, 800);

    return () => window.clearInterval(id);
  }, [palette]);

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2" aria-hidden>
      {grid.map((hex, idx) => (
        <div
          key={idx}
          className="aspect-square w-full rounded-lg motion-reduce:transition-none"
          style={{
            backgroundColor: hex,
            transition: "background-color 400ms ease",
          }}
        />
      ))}
    </div>
  );
}

export function ColourLabCTASection({ content, swatchColours }: ColourLabCTASectionProps) {
  const palette = useMemo(() => {
    const fromDb = swatchColours.map(normaliseHex);
    return fromDb.length ? fromDb : FALLBACK_PALETTE;
  }, [swatchColours]);

  return (
    <section className="relative overflow-hidden bg-[#0F6E56] py-20">
      <div className="pointer-events-none absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-[0.05] motion-reduce:animate-none"
            style={{
              width: "min(180px, 40vw)",
              height: "min(240px, 50vw)",
              background: "#fff",
              clipPath: "ellipse(40% 55% at 50% 40%)",
              top: `${15 + i * 28}%`,
              left: `${5 + i * 22}%`,
              animationName: `blob-float-${(i % 5) + 1}`,
              animationDuration: `${10 + i * 2}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-[1] mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-white/60">
              {content.colourlab_label}
            </p>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-white">
              {content.colourlab_heading}
            </h2>
            <p className="mt-4 font-sans text-[15px] text-white/70">{content.colourlab_body}</p>
            <Link
              href="/colour-lab"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#1a1a2e] px-6 py-3 font-sans text-[13px] font-medium text-white transition hover:bg-[#2D2D4E] motion-reduce:transition-none"
            >
              {content.colourlab_cta}
            </Link>
          </ScrollReveal>

          <ColourLabSwatchGrid key={palette.join(",")} palette={palette} />
        </div>
      </div>
    </section>
  );
}
