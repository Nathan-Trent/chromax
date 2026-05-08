-- Seed CMS rows for public Projects and Certifications pages (content_pages).

INSERT INTO public.content_pages (page_key, title, content, status)
VALUES (
  'projects',
  'Projects',
  '{
    "page_badge": "Projects",
    "page_heading": "Protecting structures across Nigeria",
    "page_subtext": "Real projects. Real performance. Browse our completed case studies and installations.",
    "card_cta_label": "View case study",
    "empty_title": "No projects yet",
    "empty_body": "Check back soon for our latest case studies."
  }'::jsonb,
  'live'
),
(
  'certifications',
  'Certifications',
  '{
    "page_badge": "Certifications",
    "page_heading": "Quality you can verify",
    "page_subtext": "Every product we manufacture meets international quality and safety standards.",
    "section_iso_heading": "ISO Certifications",
    "section_licence_heading": "Export Licences",
    "section_msds_heading": "Safety Data Sheets",
    "section_awards_heading": "Awards & Recognition",
    "section_other_heading": "Other Certifications",
    "download_label": "Download PDF",
    "no_doc_label": "Document coming soon",
    "empty_title": "Certifications coming soon",
    "empty_body": "Our certification documents are being uploaded. Check back soon."
  }'::jsonb,
  'live'
)
ON CONFLICT (page_key)
DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  status = 'live',
  updated_at = now();
