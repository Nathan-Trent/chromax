import { createClient } from "@/lib/supabase/server";
import type { ContentPageRow } from "@/types/content-page";

const KNOWN_KEYS = ["homepage", "about", "contact", "footer", "projects", "certifications"] as const;

export function displayTitleForPageKey(pageKey: string): string {
  const map: Record<string, string> = {
    homepage: "Homepage",
    about: "About",
    contact: "Contact",
    footer: "Footer",
    projects: "Projects",
    certifications: "Certifications",
  };
  return map[pageKey] ?? pageKey.charAt(0).toUpperCase() + pageKey.slice(1);
}

export async function getContentPagesByKeys(
  keys: readonly string[] = KNOWN_KEYS,
): Promise<ContentPageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_pages")
    .select("id, page_key, title, content, status, last_edited_by, updated_at")
    .in("page_key", [...keys])
    .order("page_key", { ascending: true });

  if (error) {
    throw new Error(`getContentPagesByKeys: ${error.message}`);
  }

  return (data ?? []) as unknown as ContentPageRow[];
}

export async function getLastEditorEmailsForContentPageIds(
  pageIds: string[],
): Promise<Record<string, string>> {
  if (!pageIds.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("record_id, user_email, created_at")
    .eq("section", "content")
    .in("record_id", pageIds)
    .order("created_at", { ascending: false });

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    const id = row.record_id;
    if (id && !map[id] && row.user_email) map[id] = row.user_email;
  }
  return map;
}

export async function ensureContentPage(pageKey: string): Promise<ContentPageRow> {
  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("content_pages")
    .select("id, page_key, title, content, status, last_edited_by, updated_at")
    .eq("page_key", pageKey)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`ensureContentPage: ${fetchErr.message}`);
  }

  if (existing) {
    return existing as unknown as ContentPageRow;
  }

  const title = displayTitleForPageKey(pageKey);
  const { data: inserted, error: insErr } = await supabase
    .from("content_pages")
    .insert({
      page_key: pageKey,
      title,
      content: {},
      status: "draft",
    })
    .select("id, page_key, title, content, status, last_edited_by, updated_at")
    .single();

  if (insErr || !inserted) {
    throw new Error(insErr?.message ?? "Failed to create content page");
  }

  return inserted as unknown as ContentPageRow;
}
