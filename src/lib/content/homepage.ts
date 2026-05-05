/** Homepage CMS shape and defaults — safe for Client Components (no Supabase server imports). */

export interface HomepageContent {
  hero_heading: string;
  hero_subheading: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_badge: string;
  hero_trust_1: string;
  hero_trust_2: string;
  hero_trust_3: string;
  hero_trust_4: string;
  trust_stat_1_number: string;
  trust_stat_1_label: string;
  trust_stat_2_number: string;
  trust_stat_2_label: string;
  trust_stat_3_number: string;
  trust_stat_3_label: string;
  trust_stat_4_number: string;
  trust_stat_4_label: string;
  categories_label: string;
  categories_heading: string;
  categories_subtext: string;
  products_label: string;
  products_heading: string;
  products_subtext: string;
  about_label: string;
  about_heading: string;
  about_body_1: string;
  about_body_2: string;
  about_stat_1_number: string;
  about_stat_1_label: string;
  about_stat_2_number: string;
  about_stat_2_label: string;
  about_cta: string;
  about_feature_1: string;
  about_feature_2: string;
  about_feature_3: string;
  about_feature_4: string;
  colourlab_label: string;
  colourlab_heading: string;
  colourlab_body: string;
  colourlab_cta: string;
  projects_label: string;
  projects_heading: string;
  certs_label: string;
  certs_heading: string;
  testimonials_label: string;
  testimonials_heading: string;
  testimonial_1_quote: string;
  testimonial_1_author: string;
  testimonial_1_company: string;
  testimonial_1_country: string;
  testimonial_2_quote: string;
  testimonial_2_author: string;
  testimonial_2_company: string;
  testimonial_2_country: string;
  cta_heading: string;
  cta_subtext: string;
  cta_primary: string;
  cta_secondary: string;
}

export const HOMEPAGE_DEFAULTS: HomepageContent = {
  hero_heading: "Engineered for Precision",
  hero_subheading:
    "Premium paint manufacturer based in Lagos. Trusted by industry across Nigeria, UK, USA and Ukraine.",
  hero_cta_primary: "Explore products",
  hero_cta_secondary: "Get a quote",
  hero_badge: "Premium Industrial Coatings · Lagos, Nigeria",
  hero_trust_1: "ISO Certified",
  hero_trust_2: "Export Licensed",
  hero_trust_3: "25+ Years",
  hero_trust_4: "Lagos Made",
  trust_stat_1_number: "25+",
  trust_stat_1_label: "Years manufacturing",
  trust_stat_2_number: "1,000+",
  trust_stat_2_label: "Formulations",
  trust_stat_3_number: "4",
  trust_stat_3_label: "Export countries",
  trust_stat_4_number: "ISO",
  trust_stat_4_label: "Certified",
  categories_label: "What we make",
  categories_heading: "Coatings for every application",
  categories_subtext:
    "From marine-grade epoxy to architectural finishes — formulated and manufactured in Lagos.",
  products_label: "Our products",
  products_heading: "Built for industry",
  products_subtext:
    "Every product tested to international standards before leaving our facility.",
  about_label: "Who we are",
  about_heading: "Made in Lagos. Trusted worldwide.",
  about_body_1:
    "Chromax-MCR has been manufacturing premium industrial coatings for over 25 years. From our facility in Ikotun, Lagos, we supply manufacturers, contractors and builders across Nigeria and export to the UK, USA and Ukraine.",
  about_body_2:
    "Every batch is tested before it leaves our facility. ISO certified. Export licensed. Built for the world.",
  about_stat_1_number: "25+",
  about_stat_1_label: "Years manufacturing",
  about_stat_2_number: "4",
  about_stat_2_label: "Export countries",
  about_cta: "Our story",
  about_feature_1: "ISO certified manufacturing process",
  about_feature_2: "Export-grade quality on every batch",
  about_feature_3: "Custom formulation service available",
  about_feature_4: "Technical support and data sheets provided",
  colourlab_label: "Colour Lab",
  colourlab_heading: "See your project in colour",
  colourlab_body:
    "Use our interactive Colour Lab to visualise our paints on a house, car, vessel or industrial structure — before you buy.",
  colourlab_cta: "Open Colour Lab",
  projects_label: "Recent projects",
  projects_heading: "Protecting structures across Nigeria",
  certs_label: "Trusted by industry",
  certs_heading: "Quality you can verify",
  testimonials_label: "What our clients say",
  testimonials_heading: "Trusted by builders, engineers and contractors",
  testimonial_1_quote:
    "Chromax coatings have protected our offshore structures for over a decade. Exceptional quality and consistent performance.",
  testimonial_1_author: "Engineering Director",
  testimonial_1_company: "Lagos Port Authority",
  testimonial_1_country: "🇳🇬",
  testimonial_2_quote:
    "We specify Chromax on all our marine contracts. The anti-fouling system is outstanding.",
  testimonial_2_author: "Technical Manager",
  testimonial_2_company: "Atlantic Shipping Co",
  testimonial_2_country: "🇬🇧",
  cta_heading: "Ready to get started?",
  cta_subtext:
    "Request a quote or explore our full product catalogue. We ship to Nigeria, UK, USA and Ukraine.",
  cta_primary: "View products",
  cta_secondary: "Get a quote",
};

export function mergeHomepageContent(raw: Record<string, unknown> | null | undefined): HomepageContent {
  const out = { ...HOMEPAGE_DEFAULTS };
  if (!raw) return out;
  for (const key of Object.keys(HOMEPAGE_DEFAULTS) as (keyof HomepageContent)[]) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v;
    }
  }
  return out;
}
