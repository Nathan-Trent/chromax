import {
  ABOUT_DEFAULTS,
  mergeAboutContent,
  type AboutContent,
} from "@/lib/content/about";
import {
  CONTACT_PAGE_DEFAULTS,
  mergeContactPageContent,
  type ContactPageContent,
} from "@/lib/content/contact-page";
import {
  FOOTER_DEFAULTS,
  mergeFooterContent,
  type FooterContent,
} from "@/lib/content/footer";
import { HOMEPAGE_DEFAULTS, mergeHomepageContent, type HomepageContent } from "@/lib/content/homepage";
import { createClient } from "@/lib/supabase/server";
import type { ContentPageRow } from "@/types/content-page";
import type { Product } from "@/lib/supabase/queries/products";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/supabase/queries/products";

export type { AboutContent, ContactPageContent, FooterContent, HomepageContent };
export { ABOUT_DEFAULTS, CONTACT_PAGE_DEFAULTS, FOOTER_DEFAULTS, HOMEPAGE_DEFAULTS };

/** Live content visible to anonymous visitors (RLS: status = live). */
export async function getLiveContentPage(pageKey: string): Promise<ContentPageRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_pages")
    .select("id, page_key, title, content, status, last_edited_by, updated_at")
    .eq("page_key", pageKey)
    .eq("status", "live")
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as ContentPageRow;
}

export function strFromContent(content: Record<string, unknown> | undefined, key: string, fallback: string): string {
  if (!content) return fallback;
  const v = content[key];
  if (typeof v === "string" && v.trim()) return v;
  return fallback;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const row = await getLiveContentPage("homepage");
  if (!row) return { ...HOMEPAGE_DEFAULTS };
  const content = row.content as Record<string, unknown> | undefined;
  return mergeHomepageContent(content);
}

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const row = await getLiveContentPage("about");
    if (!row) return { ...ABOUT_DEFAULTS };
    const content = row.content as Record<string, unknown> | undefined;
    return mergeAboutContent(content);
  } catch {
    return { ...ABOUT_DEFAULTS };
  }
}

export async function getFooterContent(): Promise<FooterContent> {
  try {
    const row = await getLiveContentPage("footer");
    if (!row) return { ...FOOTER_DEFAULTS };
    const content = row.content as Record<string, unknown> | undefined;
    return mergeFooterContent(content);
  } catch {
    return { ...FOOTER_DEFAULTS };
  }
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

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const supabase = await createClient();
  const lim = Math.min(24, Math.max(1, limit));

  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "live")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(lim);

  if (error) {
    throw new Error(`getFeaturedProducts failed: ${error.message}`);
  }

  return (data ?? []) as Product[];
}
