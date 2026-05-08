/** Types and merge helpers — safe for Client Components (no server imports). */

export interface FooterContent {
  tagline: string;
  address_line: string;
  regions_line: string;
  copyright_suffix: string;
  products_column_heading: string;
  company_column_heading: string;
  bottom_tagline: string;
}

export const FOOTER_DEFAULTS: FooterContent = {
  tagline: "Engineered for precision. Built for the world.",
  address_line: "Ikotun, Lagos, Nigeria",
  regions_line: "UK · USA · Ukraine",
  copyright_suffix: "Chromax-MCR. All rights reserved.",
  products_column_heading: "Products",
  company_column_heading: "Company",
  bottom_tagline: "Made in Lagos · Trusted worldwide",
};

export function mergeFooterContent(raw: Record<string, unknown> | null | undefined): FooterContent {
  const out = { ...FOOTER_DEFAULTS };
  if (!raw) return out;
  for (const key of Object.keys(FOOTER_DEFAULTS) as (keyof FooterContent)[]) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v;
    }
  }
  return out;
}
