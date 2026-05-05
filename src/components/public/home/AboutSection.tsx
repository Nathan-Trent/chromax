"use client";

import { AnimatedStatNumber } from "@/components/public/home/AnimatedStatNumber";
import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import type { HomepageContent } from "@/lib/content/homepage";
import Link from "next/link";

export type AboutSectionProps = {
  content: Pick<
    HomepageContent,
    | "about_label"
    | "about_heading"
    | "about_body_1"
    | "about_body_2"
    | "about_stat_1_number"
    | "about_stat_1_label"
    | "about_stat_2_number"
    | "about_stat_2_label"
    | "about_cta"
    | "about_feature_1"
    | "about_feature_2"
    | "about_feature_3"
    | "about_feature_4"
  >;
};

const features = [
  "about_feature_1",
  "about_feature_2",
  "about_feature_3",
  "about_feature_4",
] as const;

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <section className="bg-[#1a1a2e] py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <ScrollReveal variant="left">
            <p className="mb-4 inline-flex rounded-md border border-[#E8A020] px-3 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#E8A020]">
              {content.about_label}
            </p>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight text-white">
              {content.about_heading}
            </h2>
            <p className="mt-5 font-sans text-[15px] text-white/60">{content.about_body_1}</p>
            <p className="mt-4 font-sans text-[15px] text-white/60">{content.about_body_2}</p>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <div className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-[#E8A020]">
                  <AnimatedStatNumber value={content.about_stat_1_number} />
                </div>
                <p className="mt-1 font-sans text-xs uppercase tracking-wide text-white/50">
                  {content.about_stat_1_label}
                </p>
              </div>
              <div>
                <div className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-[#E8A020]">
                  <AnimatedStatNumber value={content.about_stat_2_number} />
                </div>
                <p className="mt-1 font-sans text-xs uppercase tracking-wide text-white/50">
                  {content.about_stat_2_label}
                </p>
              </div>
            </div>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center justify-center rounded-lg border-2 border-white/40 px-5 py-2.5 font-sans text-[13px] font-medium text-white transition hover:border-white/80 hover:bg-white/10 motion-reduce:transition-none"
            >
              {content.about_cta}
            </Link>
          </ScrollReveal>

          <ScrollReveal variant="right">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {features.map((k) => (
                <article
                  key={k}
                  className="rounded-xl bg-[#2D2D4E] p-5 transition duration-200 hover:border hover:border-[#E8A020]/20 hover:bg-[#383860] motion-reduce:transition-none"
                >
                  <div className="mb-3 h-2 w-2 rounded-full bg-[#E8A020]" />
                  <p className="font-sans text-[14px] leading-relaxed text-white/70">{content[k]}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
