import { ContactForm } from "@/components/public/ContactForm";
import { PageHeader } from "@/components/public/PageHeader";
import { getLiveContentPage, strFromContent } from "@/lib/supabase/queries/content-public";

const DEFAULT_ADDRESS = "Ikotun, Lagos, Nigeria";
const DEFAULT_EMAIL = "info@chromax-mcr.com";

function waHref(num: string): string {
  const digits = num.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export default async function ContactPage() {
  const row = await getLiveContentPage("contact");
  const content = row?.content as Record<string, unknown> | undefined;

  const address = strFromContent(content, "address", DEFAULT_ADDRESS);
  const email = strFromContent(content, "email", DEFAULT_EMAIL);
  const whatsappRaw = typeof content?.whatsapp === "string" ? content.whatsapp.trim() : "";

  return (
    <>
      <PageHeader
        badge="Get in touch"
        heading="We’re here to help"
        subtext="Quotes, technical questions, bulk orders — message us and we’ll respond within one business day."
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
                <p className="mt-1 font-sans text-lg font-medium text-[#1a1a2e]">{address}</p>
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
                  href={`mailto:${email}`}
                  className="mt-1 inline-block font-sans text-lg font-medium text-[#E8A020] underline-offset-2 transition duration-150 hover:underline motion-reduce:transition-none"
                >
                  {email}
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
                  Serving
                </p>
                <p className="mt-1 font-sans text-lg font-medium text-[#666]">
                  Nigeria, UK, USA and Ukraine
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#1a1a2e] p-6 text-white">
              <p className="font-sans text-[13px] font-semibold uppercase tracking-widest text-[#E8A020]">
                International enquiries
              </p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-white/60">
                For orders from the UK, USA or Ukraine, include your country and preferred currency. We&apos;ll
                respond within 1 business day.
              </p>
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
