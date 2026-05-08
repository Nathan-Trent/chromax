import { ContactForm } from "@/components/public/ContactForm";
import { PageHeader } from "@/components/public/PageHeader";
import { getContactPageContent } from "@/lib/content/contact-page";

function waHref(num: string): string {
  const digits = num.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export default async function ContactPage() {
  const cms = await getContactPageContent();

  const whatsappRaw = cms.whatsapp.trim();

  return (
    <>
      <PageHeader
        badge={cms.contact_page_badge}
        heading={cms.contact_page_heading}
        subtext={cms.contact_page_subtext}
      />

      <div className="bg-[#F5F0E8] py-16">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <div className="mb-8 flex gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8A020]/20 text-lg"
                aria-hidden
              >
                📍
              </span>
              <div>
                <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                  Address
                </p>
                <p className="mt-1 font-sans text-lg font-medium text-[#1a1a2e]">{cms.address}</p>
              </div>
            </div>
            <div className="mb-8 flex gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8A020]/20 text-lg"
                aria-hidden
              >
                📧
              </span>
              <div>
                <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                  Email
                </p>
                <a
                  href={`mailto:${cms.email}`}
                  className="mt-1 inline-block font-sans text-lg font-medium text-[#E8A020] underline-offset-2 transition duration-150 hover:underline motion-reduce:transition-none"
                >
                  {cms.email}
                </a>
              </div>
            </div>
            {whatsappRaw ? (
              <div className="mb-8 flex gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8A020]/20 text-lg"
                  aria-hidden
                >
                  💬
                </span>
                <div>
                  <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                    WhatsApp
                  </p>
                  <a
                    href={waHref(whatsappRaw)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-sans text-lg font-medium text-[#E8A020] underline-offset-2 transition duration-150 hover:underline motion-reduce:transition-none"
                  >
                    {whatsappRaw}
                  </a>
                </div>
              </div>
            ) : null}
            <div className="mb-10 flex gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8A020]/20 text-lg"
                aria-hidden
              >
                🌐
              </span>
              <div>
                <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                  {cms.contact_serving_heading}
                </p>
                <p className="mt-1 font-sans text-lg font-medium text-[#666]">{cms.contact_regions}</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#1a1a2e] p-6 text-white">
              <p className="font-sans text-[13px] font-semibold uppercase tracking-widest text-[#E8A020]">
                {cms.contact_intl_heading}
              </p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-white/60">{cms.contact_intl_body}</p>
              <div className="mt-6 grid grid-cols-4 gap-3 text-center">
                {[
                  { f: "🇳🇬", n: "Nigeria" },
                  { f: "🇬🇧", n: "UK" },
                  { f: "🇺🇸", n: "USA" },
                  { f: "🇺🇦", n: "Ukraine" },
                ].map((c) => (
                  <div key={c.n}>
                    <div className="text-2xl" aria-hidden>
                      {c.f}
                    </div>
                    <div className="mt-1 font-sans text-[11px] text-white/50">{c.n}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </>
  );
}
