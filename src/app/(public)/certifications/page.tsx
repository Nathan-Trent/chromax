import { PageHeader } from "@/components/public/PageHeader";
import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import Link from "next/link";

type CertKind = "iso" | "licence" | "safety" | "award";

type ValidityTone = "valid" | "soon" | "expired" | "neutral";

function validityTone(validText: string): ValidityTone {
  const t = validText.toLowerCase();
  if (t.includes("placeholder") || t.includes("tbc")) return "soon";
  const until = validText.match(/(\d{4})/);
  if (until) {
    const y = Number(until[1]);
    const nowY = new Date().getFullYear();
    if (y < nowY) return "expired";
    if (y <= nowY + 1) return "soon";
  }
  return "valid";
}

function ValidityBadge({ text }: { text: string }) {
  const tone = validityTone(text);
  const styles: Record<ValidityTone, string> = {
    valid: "bg-[#1D9E75]/15 text-[#1D9E75]",
    soon: "bg-[#BA7517]/15 text-[#BA7517]",
    expired: "bg-[#993C1D]/15 text-[#993C1D]",
    neutral: "bg-[#888]/15 text-[#666]",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 font-sans text-[11px] font-medium ${styles[tone]}`}>
      {text}
    </span>
  );
}

interface CertCardData {
  icon: string;
  title: string;
  subtitle: string;
  validText: string;
  kind: CertKind;
  pdfUrl?: string;
}

const stripByKind: Record<CertKind, string> = {
  iso: "#E8A020",
  licence: "#185FA5",
  safety: "#0F6E56",
  award: "#534AB7",
};

function CertCard({ icon, title, subtitle, validText, kind, pdfUrl }: CertCardData) {
  const strip = stripByKind[kind];
  const showValidity = kind !== "safety";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#E8E8E4] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#E8A020] hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="h-2 w-full shrink-0" style={{ backgroundColor: strip }} aria-hidden />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 text-5xl" aria-hidden>
          {icon}
        </div>
        <h3 className="font-[family-name:var(--font-fraunces)] mb-1 text-base font-semibold text-[#1a1a2e]">
          {title}
        </h3>
        <p className="mb-4 font-sans text-[13px] text-[#666666]">{subtitle}</p>
        {showValidity ? (
          <div className="mb-4">
            <ValidityBadge text={validText} />
          </div>
        ) : null}
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1 font-sans text-sm font-medium text-[#E8A020] transition duration-150 hover:underline motion-reduce:transition-none"
          >
            Download PDF →
          </a>
        ) : (
          <p className="mt-auto cursor-not-allowed font-sans text-sm text-[#888888]">PDF coming soon</p>
        )}
      </div>
    </article>
  );
}

export default function CertificationsPage() {
  const grid = "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <PageHeader
        badge="Certifications"
        heading="Quality you can verify"
        subtext="ISO certifications, export licences, safety documentation and industry recognition — transparency matters."
      />

      <div className="bg-[#F5F0E8] py-16">
        <div className="mx-auto max-w-[1280px] space-y-16 px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <section>
              <h2 className="font-[family-name:var(--font-fraunces)] mb-8 text-2xl font-semibold text-[#1a1a2e]">
                ISO Certifications
              </h2>
              <div className={grid}>
                <CertCard
                  icon="🏆"
                  title="ISO 9001:2015 Quality Management"
                  subtitle="Issued by: Bureau Veritas"
                  validText="Valid until December 2026"
                  kind="iso"
                />
                <CertCard
                  icon="🏆"
                  title="ISO 14001:2015 Environmental Management"
                  subtitle="Issued by: Bureau Veritas"
                  validText="Valid until December 2026"
                  kind="iso"
                />
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="rounded-2xl bg-white px-4 py-12 sm:px-6 md:px-10">
              <h2 className="font-[family-name:var(--font-fraunces)] mb-8 text-2xl font-semibold text-[#1a1a2e]">
                Export Licences
              </h2>
              <div className={grid}>
                <CertCard
                  icon="📄"
                  title="Export Licence — United Kingdom"
                  subtitle="Company export registration"
                  validText="Placeholder — dates TBC"
                  kind="licence"
                />
                <CertCard
                  icon="📄"
                  title="Export Licence — United States & Ukraine"
                  subtitle="Company export registration"
                  validText="Placeholder — dates TBC"
                  kind="licence"
                />
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section>
              <h2 className="font-[family-name:var(--font-fraunces)] mb-8 text-2xl font-semibold text-[#1a1a2e]">
                Safety Documents (MSDS)
              </h2>
              <div className={grid}>
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#E8E8E4] bg-white">
                  <div className="h-2 w-full shrink-0 bg-[#0F6E56]" aria-hidden />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 text-5xl" aria-hidden>
                      🛡️
                    </div>
                    <h3 className="font-[family-name:var(--font-fraunces)] mb-1 text-base font-semibold text-[#1a1a2e]">
                      Product MSDS library
                    </h3>
                    <p className="mb-4 font-sans text-[13px] leading-relaxed text-[#666666]">
                      Material Safety Data Sheets are available per product on individual product pages.
                    </p>
                    <Link
                      href="/products"
                      className="mt-auto inline-flex text-sm font-medium text-[#E8A020] transition duration-150 hover:underline motion-reduce:transition-none"
                    >
                      Browse products →
                    </Link>
                  </div>
                </article>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="rounded-2xl bg-white px-4 py-12 sm:px-6 md:px-10">
              <h2 className="font-[family-name:var(--font-fraunces)] mb-8 text-2xl font-semibold text-[#1a1a2e]">
                Awards & Accreditations
              </h2>
              <div className={grid}>
                <CertCard
                  icon="⭐"
                  title="Nigerian Manufacturers Association — Member"
                  subtitle="Industry body accreditation"
                  validText="Member since 2012 (placeholder)"
                  kind="award"
                />
                <CertCard
                  icon="⭐"
                  title="Export Excellence — Regional recognition"
                  subtitle="Placeholder award title"
                  validText="Display copy TBC"
                  kind="award"
                />
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </>
  );
}
