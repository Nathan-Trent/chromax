import type { HomepageContent } from "@/lib/content/homepage";
import Link from "next/link";

export type CTASectionProps = {
  content: Pick<HomepageContent, "cta_heading" | "cta_subtext" | "cta_primary" | "cta_secondary">;
};

export function CTASection({ content }: CTASectionProps) {
  return (
    <section className="relative overflow-hidden py-24">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#E8A020] to-[#BA7517]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 motion-reduce:hidden"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          animation: "cta-shine 4s linear infinite",
          filter: "blur(24px)",
        }}
      />
      <div className="relative z-[1] mx-auto max-w-[1280px] px-6 text-center">
        <h2 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold text-[#1a1a2e]">
          {content.cta_heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-[15px] text-[#1a1a2e]/70">{content.cta_subtext}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#1a1a2e] px-6 font-sans text-[13px] font-medium text-white transition hover:bg-[#2D2D4E] motion-reduce:transition-none"
          >
            {content.cta_primary}
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-[#1a1a2e]/30 px-6 font-sans text-[13px] font-medium text-[#1a1a2e] transition hover:bg-[#1a1a2e]/10 motion-reduce:transition-none"
          >
            {content.cta_secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
