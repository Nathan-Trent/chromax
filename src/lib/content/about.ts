/** Types and merge helpers — safe for Client Components (no server imports). */

export interface AboutContent {
  about_hero_badge: string;
  about_hero_heading: string;
  about_hero_subtext: string;
  story_p1: string;
  story_p2: string;
  story_p3: string;
  about_stat_1_number: string;
  about_stat_1_label: string;
  about_stat_2_number: string;
  about_stat_2_label: string;
  about_stat_3_number: string;
  about_stat_3_label: string;
  about_stat_4_number: string;
  about_stat_4_label: string;
  about_feature_1: string;
  about_feature_2: string;
  about_feature_3: string;
  about_feature_4: string;
  about_process_heading: string;
  about_process_1_title: string;
  about_process_1_desc: string;
  about_process_2_title: string;
  about_process_2_desc: string;
  about_process_3_title: string;
  about_process_3_desc: string;
  about_process_4_title: string;
  about_process_4_desc: string;
  about_cta_heading: string;
  about_cta_subtext: string;
  about_cta_primary: string;
  about_cta_secondary: string;
}

export const ABOUT_DEFAULTS: AboutContent = {
  about_hero_badge: "About us",
  about_hero_heading: "Made in Lagos. Trusted worldwide.",
  about_hero_subtext:
    "Premium industrial coatings manufacturer. ISO certified. Export licensed. Built for the world.",
  story_p1:
    "Founded in 1999 in Ikotun, Lagos, Chromax-MCR began as a small industrial coatings workshop serving local manufacturers. Over two decades, we have grown into one of Nigeria's leading paint manufacturers — supplying contractors, builders and industrial operators across the country.",
  story_p2:
    "Our expansion into international markets began with exports to Ukraine, followed by the United Kingdom and United States. Today, our products protect infrastructure, vessels and vehicles in four countries — formulated and manufactured entirely in Lagos.",
  story_p3:
    "We operate an ISO-certified manufacturing facility with full quality control at every stage — from raw material selection to final dispatch. Every batch is tested before it leaves our facility.",
  about_stat_1_number: "25+",
  about_stat_1_label: "Years manufacturing",
  about_stat_2_number: "1,000+",
  about_stat_2_label: "Formulations",
  about_stat_3_number: "4",
  about_stat_3_label: "Export countries",
  about_stat_4_number: "ISO",
  about_stat_4_label: "Certified",
  about_feature_1: "ISO certified manufacturing process",
  about_feature_2: "Export-grade quality on every batch",
  about_feature_3: "Custom formulation service available",
  about_feature_4: "Technical support and data sheets provided",
  about_process_heading: "How we manufacture",
  about_process_1_title: "Raw material sourcing",
  about_process_1_desc:
    "We source premium pigments and resins from certified suppliers worldwide.",
  about_process_2_title: "Laboratory formulation",
  about_process_2_desc:
    "Our chemists develop and test each formula to meet international standards.",
  about_process_3_title: "Production and quality control",
  about_process_3_desc:
    "Every batch is produced in our ISO-certified facility and tested before packaging.",
  about_process_4_title: "Packaging and dispatch",
  about_process_4_desc:
    "Products are packaged, labelled, and dispatched from our Lagos facility.",
  about_cta_heading: "Ready to work with us?",
  about_cta_subtext: "Request a quote or browse our full product catalogue.",
  about_cta_primary: "View products",
  about_cta_secondary: "Get in touch",
};

export function mergeAboutContent(raw: Record<string, unknown> | null | undefined): AboutContent {
  const out = { ...ABOUT_DEFAULTS };
  if (!raw) return out;
  for (const key of Object.keys(ABOUT_DEFAULTS) as (keyof AboutContent)[]) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v;
    }
  }
  return out;
}
