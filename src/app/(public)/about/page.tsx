import { AboutStatsStrip } from "@/components/public/about/AboutStatsStrip";
import { PageHeader } from "@/components/public/PageHeader";
import { getAboutContent } from "@/lib/supabase/queries/content-public";
import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import Link from "next/link";
import { Fragment } from "react";

const primaryCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-gold)] px-6 py-3 font-sans text-[13px] font-medium text-[var(--color-navy)] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]";

const outlineCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/40 px-6 py-3 font-sans text-[13px] font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default async function AboutPage() {
  const content = await getAboutContent();

  const stats = [
    { number: content.about_stat_1_number, label: content.about_stat_1_label },
    { number: content.about_stat_2_number, label: content.about_stat_2_label },
    { number: content.about_stat_3_number, label: content.about_stat_3_label },
    { number: content.about_stat_4_number, label: content.about_stat_4_label },
  ];

  const featureItems = [
    content.about_feature_1,
    content.about_feature_2,
    content.about_feature_3,
    content.about_feature_4,
  ].filter(Boolean);

  const processSteps = [
    {
      n: 1,
      title: content.about_process_1_title,
      desc: content.about_process_1_desc,
    },
    {
      n: 2,
      title: content.about_process_2_title,
      desc: content.about_process_2_desc,
    },
    {
      n: 3,
      title: content.about_process_3_title,
      desc: content.about_process_3_desc,
    },
    {
      n: 4,
      title: content.about_process_4_title,
      desc: content.about_process_4_desc,
    },
  ];

  return (
    <>
      <PageHeader
        badge={content.about_hero_badge}
        heading={content.about_hero_heading}
        subtext={content.about_hero_subtext}
      />

      <AboutStatsStrip stats={stats} />

      <section className="bg-[#F5F0E8] py-20">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] mb-8 text-3xl font-semibold text-[#1a1a2e]">
              Our story
            </h2>
            <p className="mb-6 border-l-4 border-[#E8A020] pl-4 font-sans text-[15px] leading-relaxed text-[#555555]">
              {content.story_p1}
            </p>
            <p className="mb-6 font-sans text-[15px] leading-relaxed text-[#555555]">{content.story_p2}</p>
            <p className="font-sans text-[15px] leading-relaxed text-[#555555]">{content.story_p3}</p>
          </div>
          <ul className="flex flex-col justify-center">
            {featureItems.map((text, i) => (
              <ScrollReveal key={text} style={{ transitionDelay: `${i * 80}ms` }}>
                <li className="mb-4 flex items-start gap-3 last:mb-0">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E8A020]"
                    aria-hidden
                  />
                  <span className="text-[13px] leading-relaxed text-[#444444]">{text}</span>
                </li>
              </ScrollReveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-fraunces)] mb-14 text-center text-3xl font-semibold text-[#1a1a2e] md:text-4xl">
            {content.about_process_heading}
          </h2>

          <div className="hidden md:flex md:items-start md:justify-between md:gap-0">
            {processSteps.map((step, i) => (
              <Fragment key={step.n}>
                <ScrollReveal
                  className="max-w-[200px] flex-1 text-center"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[#E8A020]">
                    {step.n}
                  </div>
                  <p className="mb-2 mt-4 text-[15px] font-semibold text-[#1a1a2e]">{step.title}</p>
                  <p className="text-[13px] leading-relaxed text-[#666666]">{step.desc}</p>
                </ScrollReveal>
                {i < processSteps.length - 1 ? (
                  <div
                    className="mx-2 mt-7 h-0 min-w-[1.5rem] flex-1 border-t border-dashed border-[#E8A020]"
                    aria-hidden
                  />
                ) : null}
              </Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-10 md:hidden">
            {processSteps.map((step, i) => (
              <ScrollReveal key={step.n} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a2e] font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[#E8A020]">
                    {step.n}
                  </div>
                  <p className="mb-2 mt-4 text-[15px] font-semibold text-[#1a1a2e]">{step.title}</p>
                  <p className="text-[13px] text-[#666666]">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1a1a2e] py-20">
        <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-white">
            {content.about_cta_heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-[15px] text-white/60">
            {content.about_cta_subtext}
          </p>
          <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-4">
            <Link href="/products" className={primaryCtaClass}>
              {content.about_cta_primary}
            </Link>
            <Link href="/contact" className={outlineCtaClass}>
              {content.about_cta_secondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
