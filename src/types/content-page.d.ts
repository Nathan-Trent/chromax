export type ContentPageStatus = "draft" | "live";

export type ContentPageRow = {
  id: string;
  page_key: string;
  title: string | null;
  content: Record<string, unknown>;
  status: ContentPageStatus;
  last_edited_by: string | null;
  updated_at: string;
};
