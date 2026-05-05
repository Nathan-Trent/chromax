"use client";

import type { HomepageContent } from "@/lib/content/homepage";
import Link from "next/link";

export type HeroSectionProps = {
  content: Pick<
    HomepageContent,
    | "hero_heading"
    | "hero_subheading"
    | "hero_cta_primary"
    | "hero_cta_secondary"
    | "hero_badge"
    | "hero_trust_1"
    | "hero_trust_2"
    | "hero_trust_3"
    | "hero_trust_4"
  >;
};

const primaryBtnClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-[#E8A020] px-8 py-3 font-sans text-sm font-medium text-[#1a1a2e] transition duration-150 ease-out hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)] motion-reduce:transition-none sm:text-[14px]";

const BLOBS: {
  color: string;
  anim: string;
  duration: string;
  delay: string;
  size: string;
  top: string;
  left?: string;
  right?: string;
}[] = [
  {
    color: "var(--color-industrial)",
    anim: "blob-float-1",
    duration: "8s",
    delay: "0s",
    size: "min(42vw, 380px)",
    top: "8%",
    left: "-6%",
  },
  {
    color: "var(--color-marine)",
    anim: "blob-float-2",
    duration: "12s",
    delay: "0.5s",
    size: "min(38vw, 320px)",
    top: "52%",
    left: "-4%",
  },
  {
    color: "var(--color-automotive)",
    anim: "blob-float-3",
    duration: "10s",
    delay: "1s",
    size: "min(36vw, 300px)",
    top: "18%",
    right: "-8%",
  },
  {
    color: "var(--color-architectural)",
    anim: "blob-float-4",
    duration: "14s",
    delay: "0.2s",
    size: "min(40vw, 340px)",
    top: "58%",
    right: "-2%",
  },
  {
    color: "var(--color-custom)",
    anim: "blob-float-5",
    duration: "9s",
    delay: "1.2s",
    size: "min(28vw, 240px)",
    top: "40%",
    left: "32%",
  },
];

function HeroRightPaintSplash() {
  return (
    <div className="relative hidden lg:flex items-center justify-center h-full">
      <div className="relative h-[480px] w-[480px]">
        <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8A020] opacity-80 blur-[2px] shadow-[0_0_80px_40px_rgba(232,160,32,0.4)]" />
        <div
          className="absolute top-8 left-12 h-32 w-32 rounded-full bg-[#185FA5] opacity-70 blur-[1px] shadow-[0_0_60px_30px_rgba(24,95,165,0.3)]"
          style={{ animation: "float-1 6s ease-in-out infinite" }}
        />
        <div
          className="absolute top-16 right-8 h-28 w-28 rounded-full bg-[#0F6E56] opacity-70 blur-[1px] shadow-[0_0_50px_25px_rgba(15,110,86,0.3)]"
          style={{ animation: "float-2 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-16 left-8 h-24 w-24 rounded-full bg-[#993C1D] opacity-70 blur-[1px] shadow-[0_0_50px_25px_rgba(153,60,29,0.3)]"
          style={{ animation: "float-3 7s ease-in-out infinite" }}
        />
        <div
          className="absolute right-16 bottom-8 h-20 w-20 rounded-full bg-[#534AB7] opacity-70 blur-[1px] shadow-[0_0_40px_20px_rgba(83,74,183,0.3)]"
          style={{ animation: "float-1 9s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute top-1/2 left-0 h-16 w-16 -translate-y-1/2 rounded-full bg-[#BA7517] opacity-60 blur-[1px]"
          style={{ animation: "float-2 5s ease-in-out infinite reverse" }}
        />
        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="mb-2 font-sans text-[11px] font-medium tracking-[3px] text-white/40 uppercase">
            Since 1999
          </div>
          <div className="font-[family-name:var(--font-fraunces)] text-7xl leading-none font-semibold text-white drop-shadow-2xl">
            MCR
          </div>
          <div className="mt-2 font-sans text-[11px] font-medium tracking-[3px] text-white/40 uppercase">
            Lagos · Nigeria
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ content }: HeroSectionProps) {
  const words = content.hero_heading.trim().split(/\s+/).filter(Boolean);
  const trustItems = [
    content.hero_trust_1,
    content.hero_trust_2,
    content.hero_trust_3,
    content.hero_trust_4,
  ].filter(Boolean);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#1a1a2e]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((b, i) => (
          <div
            key={i}
            className={`absolute rounded-full opacity-[0.22] motion-reduce:animate-none md:opacity-[0.38]`}
            style={{
              top: b.top,
              left: b.left,
              right: b.right,
              width: b.size,
              height: b.size,
              background: b.color,
              filter: "blur(60px)",
              animationName: b.anim,
              animationDuration: b.duration,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: b.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-[1] mx-auto grid min-h-screen max-w-[1280px] grid-cols-1 items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-0">
        {/* LEFT: badge → H1 → subtext → buttons → trust row only */}
        <div className="min-w-0">
          <div
            className="hero-word mb-6 motion-reduce:opacity-100"
            style={{ animationDelay: "0ms" }}
          >
            <p className="inline-flex rounded-md border border-[#E8A020] px-3 py-1.5 font-sans text-sm font-medium uppercase tracking-[0.12em] text-[#E8A020] sm:text-[11px] sm:tracking-[0.2em]">
              {content.hero_badge}
            </p>
          </div>

          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
            {words.map((w, i) => (
              <span
                key={`${w}-${i}`}
                className="hero-word mr-[0.2em] inline-block last:mr-0"
                style={{ animationDelay: `${80 * i}ms` }}
              >
                {w}
              </span>
            ))}
          </h1>

          <p
            className="hero-word mt-6 max-w-xl text-lg text-white/60 motion-reduce:opacity-100"
            style={{ animationDelay: "400ms" }}
          >
            {content.hero_subheading}
          </p>

          <div
            className="hero-word mt-8 motion-reduce:opacity-100"
            style={{ animationDelay: "600ms" }}
          >
            <div className="flex w-full max-w-lg flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <Link
                href="/products"
                className={`${primaryBtnClass} w-full min-h-11 justify-center sm:w-auto sm:min-h-0`}
              >
                {content.hero_cta_primary}
              </Link>
              <Link
                href="/contact"
                className="inline-flex w-full min-h-11 items-center justify-center whitespace-nowrap rounded-lg border-2 border-white/40 bg-white/5 px-8 py-3 font-sans text-sm font-medium text-white transition duration-150 ease-out hover:border-white/70 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A020] motion-reduce:transition-none sm:w-auto sm:min-h-0 sm:text-[14px]"
              >
                {content.hero_cta_secondary}
              </Link>
            </div>
          </div>

          <div
            className="hero-word mt-6 motion-reduce:opacity-100"
            style={{ animationDelay: "800ms" }}
            aria-label="Trust signals"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-row sm:flex-wrap sm:gap-x-6">
              {trustItems.map((item, i) => (
                <div key={`${item}-${i}`} className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8A020]/20"
                    aria-hidden
                  >
                    <span className="font-sans text-sm font-bold text-[#E8A020]">✓</span>
                  </span>
                  <span className="min-w-0 font-sans text-sm font-medium uppercase tracking-wide text-white/55 sm:tracking-widest">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: visual only — no copy, no trust signals */}
        <div className="min-w-0">
          <HeroRightPaintSplash />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 motion-reduce:hidden lg:block">
        <div
          className="text-white/30"
          style={{
            animation: "scroll-hint-bounce 2.2s ease-in-out infinite",
          }}
        >
          <svg width="28" height="40" viewBox="0 0 24 40" aria-hidden fill="none">
            <path
              d="M12 3c-3 0-5 2.2-5 5v12c0 2.8 2.2 5 5 5s5-2.2 5-5V8c0-2.8-2-5-5-5z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M12 10v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
