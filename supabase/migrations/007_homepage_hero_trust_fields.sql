-- Merge hero trust chip strings into existing homepage JSON (idempotent for re-runs).

UPDATE public.content_pages
SET
  content = COALESCE(content, '{}'::jsonb)
    || jsonb_build_object(
      'hero_trust_1', 'ISO Certified',
      'hero_trust_2', 'Export Licensed',
      'hero_trust_3', '25+ Years',
      'hero_trust_4', 'Lagos Made'
    ),
  updated_at = now()
WHERE page_key = 'homepage';
