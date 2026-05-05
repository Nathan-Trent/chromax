import { AboutStatsStrip } from "@/components/public/about/AboutStatsStrip";
import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import { getLiveContentPage, strFromContent } from "@/lib/supabase/queries/content-public";
import Link from "next/link";
import { Fragment } from "react";

const primaryCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-gold)] px-6 py-3 font-sans text-[13px] font-medium text-[var(--color-navy)] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]";

const outlineCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/40 px-6 py-3 font-sans text-[13px] font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const featureItems = [
  "State-of-the-art manufacturing plant in Ikotun",
  "Full ISO certification and export licensing",
  "In-house quality control and batch testing",
  "Technical support team for specification guidance",
];

const processSteps = [
  {
    n: 1,
    title: "Raw materials",
    desc: "Sourced and tested on arrival against specification",
  },
  {
    n: 2,
    title: "Formulation",
    desc: "Mixed to precise ratios in our temperature-controlled facility",
  },
  {
    n: 3,
    title: "Quality control",
    desc: "Every batch tested for consistency, coverage and adhesion",
  },
  {
    n: 4,
    title: "Dispatch",
    desc: "Packaged and shipped with full documentation and batch records",
  },
];

const DEFAULT_STORY_P1 =
  "Founded in 1999 in Ikotun, Lagos, Chromax-MCR began as a small industrial coatings workshop serving local manufacturers. Over two decades, we have grown into one of Nigeria's leading paint manufacturers — supplying contractors, builders and industrial operators across the country.";

const DEFAULT_STORY_P2 =
  "Our expansion into international markets began with exports to Ukraine, followed by the United Kingdom and United States. Today, our products protect infrastructure, vessels and vehicles in four countries — formulated and manufactured entirely in Lagos.";

const DEFAULT_STORY_P3 =
  "We operate an ISO-certified manufacturing facility with full quality control at every stage — from raw material selection to final dispatch. Every batch is tested before it leaves our facility.";

export default async function AboutPage() {
  const row = await getLiveContentPage("about");
  const content = row?.content as Record<string, unknown> | undefined;

  const story1 = strFromContent(content, "story_p1", DEFAULT_STORY_P1);
  const story2 = strFromContent(content, "story_p2", DEFAULT_STORY_P2);
  const story3 = strFromContent(content, "story_p3", DEFAULT_STORY_P3);

  return (
    <>
      <section className="relative flex min-h-[50vh] items-center overflow-hidden bg-[#1a1a2e] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-[12%] right-[8%] h-40 w-40 rounded-full bg-[#185FA5]/35 blur-3xl motion-reduce:blur-none"
            aria-hidden
          />
          <div
            className="absolute bottom-[18%] left-[5%] h-48 w-48 rounded-full bg-[#E8A020]/25 blur-3xl motion-reduce:blur-none"
            aria-hidden
          />
          <div
            className="absolute top-[40%] left-[35%] h-32 w-32 rounded-full bg-[#0F6E56]/30 blur-2xl motion-reduce:blur-none"
            aria-hidden
          />
        </div>
        <div className="relative z-[1] mx-auto max-w-[1280px] px-6">
          <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#E8A020]">
            About us
          </p>
          <h1 className="font-[family-name:var(--font-fraunces)] mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
            Made in Lagos. Trusted worldwide.
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-lg text-white/60">
            Chromax-MCR has been manufacturing premium industrial coatings since 1999. From Ikotun,
            Lagos we supply Nigeria and export to the UK, USA and Ukraine.
          </p>
        </div>
      </section>

      <AboutStatsStrip />

      <section className="bg-[#F5F0E8] py-20">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] mb-8 text-3xl font-semibold text-[#1a1a2e]">
              Our story
            </h2>
            <p className="mb-6 border-l-4 border-[#E8A020] pl-4 font-sans text-[15px] leading-relaxed text-[#555555]">
              {story1}
            </p>
            <p className="mb-6 font-sans text-[15px] leading-relaxed text-[#555555]">{story2}</p>
            <p className="font-sans text-[15px] leading-relaxed text-[#555555]">{story3}</p>
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
        <div className="mx-auto max-w-[1280px] px-6">
          <h2 className="font-[family-name:var(--font-fraunces)] mb-14 text-center text-3xl font-semibold text-[#1a1a2e] md:text-4xl">
            How we manufacture
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
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-white">
            Ready to work with us?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-[15px] text-white/60">
            Discover coatings formulated in Lagos for industrial, marine, automotive and architectural use.
          </p>
          <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-4">
            <Link href="/products" className={primaryCtaClass}>
              View products
            </Link>
            <Link href="/contact" className={outlineCtaClass}>
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
