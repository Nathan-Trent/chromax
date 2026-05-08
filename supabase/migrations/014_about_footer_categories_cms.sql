-- Extend CMS: About page, Footer row, homepage category cards + contact header fields, contact row.

UPDATE public.content_pages
SET content = content || '{
  "about_hero_badge": "About us",
  "about_hero_heading": "Made in Lagos. Trusted worldwide.",
  "about_hero_subtext": "Premium industrial coatings manufacturer. ISO certified. Export licensed. Built for the world.",
  "about_stat_1_number": "25+",
  "about_stat_1_label": "Years manufacturing",
  "about_stat_2_number": "1,000+",
  "about_stat_2_label": "Formulations",
  "about_stat_3_number": "4",
  "about_stat_3_label": "Export countries",
  "about_stat_4_number": "ISO",
  "about_stat_4_label": "Certified",
  "about_feature_1": "ISO certified manufacturing process",
  "about_feature_2": "Export-grade quality on every batch",
  "about_feature_3": "Custom formulation service available",
  "about_feature_4": "Technical support and data sheets provided",
  "about_process_heading": "How we manufacture",
  "about_process_1_title": "Raw material sourcing",
  "about_process_1_desc": "We source premium pigments and resins from certified suppliers worldwide.",
  "about_process_2_title": "Laboratory formulation",
  "about_process_2_desc": "Our chemists develop and test each formula to meet international standards.",
  "about_process_3_title": "Production and quality control",
  "about_process_3_desc": "Every batch is produced in our ISO-certified facility and tested before packaging.",
  "about_process_4_title": "Packaging and dispatch",
  "about_process_4_desc": "Products are packaged, labelled, and dispatched from our Lagos facility.",
  "about_cta_heading": "Ready to work with us?",
  "about_cta_subtext": "Request a quote or browse our full product catalogue.",
  "about_cta_primary": "View products",
  "about_cta_secondary": "Get in touch"
}'::jsonb
WHERE page_key = 'about';

INSERT INTO public.content_pages (page_key, title, content, status)
VALUES (
  'footer',
  'Footer',
  '{
    "tagline": "Engineered for precision. Built for the world.",
    "address_line": "Ikotun, Lagos, Nigeria",
    "regions_line": "UK · USA · Ukraine",
    "copyright_suffix": "Chromax-MCR. All rights reserved.",
    "products_column_heading": "Products",
    "company_column_heading": "Company",
    "bottom_tagline": "Made in Lagos · Trusted worldwide"
  }'::jsonb,
  'live'
)
ON CONFLICT (page_key)
DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  status = 'live',
  updated_at = now();

UPDATE public.content_pages
SET content = content || '{
  "cat_industrial_name": "Industrial",
  "cat_industrial_desc": "Machinery & infrastructure",
  "cat_industrial_emoji": "⚙️",
  "cat_marine_name": "Marine",
  "cat_marine_desc": "Vessels & offshore",
  "cat_marine_emoji": "⚓",
  "cat_automotive_name": "Automotive",
  "cat_automotive_desc": "Premium finishes",
  "cat_automotive_emoji": "🚗",
  "cat_architectural_name": "Architectural",
  "cat_architectural_desc": "Walls & buildings",
  "cat_architectural_emoji": "🏠",
  "cat_custom_name": "Custom",
  "cat_custom_desc": "Bespoke formulations",
  "cat_custom_emoji": "🧪",
  "contact_page_badge": "Get in touch",
  "contact_page_heading": "We are here to help",
  "contact_page_subtext": "Reach out for product enquiries, bulk orders, technical support, or export queries.",
  "contact_serving_heading": "Serving",
  "contact_regions": "Nigeria, UK, USA and Ukraine",
  "contact_intl_heading": "International enquiries",
  "contact_intl_body": "We export to the UK, USA and Ukraine. Contact us for international pricing, shipping documentation, and export licensing."
}'::jsonb
WHERE page_key = 'homepage';

UPDATE public.content_pages
SET content = content || '{
  "contact_page_badge": "Get in touch",
  "contact_page_heading": "We are here to help",
  "contact_page_subtext": "Reach out for product enquiries, bulk orders, technical support, or export queries.",
  "contact_serving_heading": "Serving",
  "contact_regions": "Nigeria, UK, USA and Ukraine",
  "contact_intl_heading": "International enquiries",
  "contact_intl_body": "We export to the UK, USA and Ukraine. Contact us for international pricing, shipping documentation, and export licensing."
}'::jsonb
WHERE page_key = 'contact';
