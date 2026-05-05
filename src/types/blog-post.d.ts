export type BlogPostType = "blog" | "guide";

export type BlogPostStatus = "draft" | "live" | "archived";

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_html: string | null;
  cover_image_url: string | null;
  author_id: string | null;
  author_name: string | null;
  tags: string[] | null;
  post_type: BlogPostType;
  status: BlogPostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};
