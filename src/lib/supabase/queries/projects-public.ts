import { createClient } from "@/lib/supabase/server";
import type { ProjectRow } from "@/types/project";

const PROJECT_COLUMNS =
  "id,title,slug,description,body_html,sector,client_name,location,photos,product_ids,is_case_study,status,created_at,updated_at" as const;

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
