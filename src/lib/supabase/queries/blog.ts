import { createClient } from "@/lib/supabase/server";

export const BLOG_POST_COLUMNS =
  "id,title,slug,excerpt,body_html,cover_image_url,author_id,author_name,tags,post_type,status,published_at,seo_title,seo_description,created_at,updated_at" as const;

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_html: string | null;
  cover_image_url: string | null;
  author_id: string | null;
  author_name: string | null;
  tags: string[] | null;
  post_type: "blog" | "guide";
  status: "draft" | "live" | "archived";
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: Record<string, unknown>): BlogPost {
  return row as unknown as BlogPost;
}

export async function getBlogPosts(filters?: {
  type?: "blog" | "guide";
  page?: number;
  limit?: number;
}): Promise<{ posts: BlogPost[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 24));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("blog_posts")
    .select(BLOG_POST_COLUMNS, { count: "exact" })
    .eq("status", "live")
    .not("published_at", "is", null);

  if (filters?.type === "blog" || filters?.type === "guide") {
    query = query.eq("post_type", filters.type);
  }

  query = query
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`getBlogPosts failed: ${error.message}`);
  }

  return {
    posts: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_POST_COLUMNS)
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (error) {
    throw new Error(`getBlogPostBySlug failed for "${slug}": ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRow(data as Record<string, unknown>);
}
