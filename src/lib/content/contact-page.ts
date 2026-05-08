import { getLiveContentPage } from "@/lib/supabase/queries/content-public";

export interface ContactPageContent {
  contact_page_badge: string;
  contact_page_heading: string;
  contact_page_subtext: string;
  address: string;
  email: string;
  whatsapp: string;
  contact_serving_heading: string;
  contact_regions: string;
  contact_intl_heading: string;
  contact_intl_body: string;
}

export const CONTACT_PAGE_DEFAULTS: ContactPageContent = {
  contact_page_badge: "Get in touch",
  contact_page_heading: "We're here to help",
  contact_page_subtext:
    "Reach out for product enquiries, bulk orders, technical support, or export queries.",
  address: "Ikotun, Lagos, Nigeria",
  email: "info@chromax-mcr.com",
  whatsapp: "",
  contact_serving_heading: "Serving",
  contact_regions: "Nigeria, UK, USA and Ukraine",
  contact_intl_heading: "International enquiries",
  contact_intl_body:
    "We export to the UK, USA and Ukraine. Contact us for international pricing, shipping documentation, and export licensing.",
};

export function mergeContactPageContent(
  raw: Record<string, unknown> | null | undefined,
): ContactPageContent {
  const out = { ...CONTACT_PAGE_DEFAULTS };
  if (!raw) return out;
  for (const key of Object.keys(CONTACT_PAGE_DEFAULTS) as (keyof ContactPageContent)[]) {
    const v = raw[key];
    if (typeof v === "string") {
      out[key] = v;
    }
  }
  return out;
}

export async function getContactPageContent(): Promise<ContactPageContent> {
  try {
    const row = await getLiveContentPage("contact");
    if (!row) return { ...CONTACT_PAGE_DEFAULTS };
    const content = row.content as Record<string, unknown> | undefined;
    return mergeContactPageContent(content);
  } catch {
    return { ...CONTACT_PAGE_DEFAULTS };
  }
}
