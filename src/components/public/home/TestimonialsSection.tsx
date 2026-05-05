"use client";

import { AnimatedStatNumber } from "@/components/public/home/AnimatedStatNumber";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";
import type { HomepageContent } from "@/lib/content/homepage";
import { useCallback, useMemo } from "react";

export type TestimonialsSectionProps = {
  content: Pick<
    HomepageContent,
    | "testimonials_label"
    | "testimonials_heading"
    | "trust_stat_1_number"
    | "trust_stat_1_label"
    | "trust_stat_2_number"
    | "trust_stat_2_label"
    | "testimonial_1_quote"
    | "testimonial_1_author"
    | "testimonial_1_company"
    | "testimonial_1_country"
    | "testimonial_2_quote"
    | "testimonial_2_author"
    | "testimonial_2_company"
    | "testimonial_2_country"
  >;
};

export function TestimonialsSection({ content }: TestimonialsSectionProps) {
  const cards = useMemo(
    () => [
      {
        quote: content.testimonial_1_quote,
        author: content.testimonial_1_author,
        company: content.testimonial_1_company,
        country: content.testimonial_1_country,
      },
      {
        quote: content.testimonial_2_quote,
        author: content.testimonial_2_author,
        company: content.testimonial_2_company,
        country: content.testimonial_2_country,
      },
    ],
    [content],
  );

  return (
    <section className="bg-[#1a1a2e] py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-center md:gap-16 lg:gap-24">
          <div className="text-center md:text-left">
            <div className="font-[family-name:var(--font-fraunces)] text-7xl font-semibold text-[#E8A020]">
              <AnimatedStatNumber value={content.trust_stat_1_number} />
            </div>
            <p className="mt-2 font-sans text-sm uppercase tracking-wide text-white/50">
              {content.trust_stat_1_label}
            </p>
          </div>
          <div className="text-center md:text-left">
            <div className="font-[family-name:var(--font-fraunces)] text-7xl font-semibold text-[#E8A020]">
              <AnimatedStatNumber value={content.trust_stat_2_number} />
            </div>
            <p className="mt-2 font-sans text-sm uppercase tracking-wide text-white/50">
              {content.trust_stat_2_label}
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl text-center">
          <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-white/50">
            {content.testimonials_label}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-white md:text-4xl">
            {content.testimonials_heading}
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <TestimonialCard key={i} {...c} delayMs={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  quote,
  author,
  company,
  country,
  delayMs,
}: {
  quote: string;
  author: string;
  company: string;
  country: string;
  delayMs: number;
}) {
  const ref = useScrollReveal();

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref(node);
    },
    [ref],
  );

  return (
    <div
      ref={setRef}
      className="reveal-up rounded-xl bg-[#2D2D4E] p-8"
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <span className="font-[family-name:var(--font-fraunces)] text-6xl leading-none font-semibold text-[#E8A020]">
        “
      </span>
      <p className="mt-2 font-sans text-[15px] italic leading-relaxed text-white/80">{quote}</p>
      <div className="mt-6 flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {country}
        </span>
        <div>
          <p className="font-sans text-[13px] font-medium text-white">{author}</p>
          <p className="font-sans text-[12px] text-white/50">{company}</p>
        </div>
      </div>
    </div>
  );
}
