import { createClient } from "@/lib/supabase/server";
import type { ProjectRow } from "@/types/project";

const PROJECT_COLUMNS =
  "id,title,slug,description,body_html,sector,client_name,location,photos,product_ids,is_case_study,status,created_at,updated_at" as const;

/** Shape exposed to public routes (maps DB `description` → `short_description`). */
export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  sector: string;
  client_name: string | null;
  location: string | null;
  short_description: string | null;
  body: string | null;
  is_case_study: boolean;
  status: string;
  created_at: string;
}

function mapRow(row: Record<string, unknown>): PublicProject {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    sector: row.sector != null && String(row.sector).trim() ? String(row.sector).trim() : "",
    client_name: row.client_name != null ? String(row.client_name) : null,
    location: row.location != null ? String(row.location) : null,
    short_description: row.description != null ? String(row.description) : null,
    body: row.body_html != null ? String(row.body_html) : null,
    is_case_study: Boolean(row.is_case_study),
    status: String(row.status ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

export async function getPublicProjects(sector?: string): Promise<PublicProject[]> {
  const supabase = await createClient();
  let q = supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", "live")
    .order("created_at", { ascending: false });

  if (sector?.trim()) {
    q = q.eq("sector", sector.trim());
  }

  const { data, error } = await q;

  if (error || !data) {
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapRow);
}

export async function getPublicProjectBySlug(slug: string): Promise<PublicProject | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("slug", trimmed)
    .eq("status", "live")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as Record<string, unknown>);
}

/** Distinct non-empty sectors among live projects (for filter chips). */
export async function getPublicProjectSectors(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("sector")
    .eq("status", "live");

  if (error || !data?.length) {
    return [];
  }

  const set = new Set<string>();
  for (const row of data as { sector: string | null }[]) {
    const s = row.sector?.trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getRecentProjects(limit = 3): Promise<ProjectRow[]> {
  const supabase = await createClient();
  const lim = Math.min(12, Math.max(1, limit));

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(lim);

  if (error) {
    throw new Error(`getRecentProjects failed: ${error.message}`);
  }

  return (data ?? []) as ProjectRow[];
}
