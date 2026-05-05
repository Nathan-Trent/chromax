export type ProjectStatus = "draft" | "live" | "archived";

export type ProjectSector =
  | "offshore"
  | "construction"
  | "automotive"
  | "marine"
  | "infrastructure";

export type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  body_html: string | null;
  sector: string | null;
  client_name: string | null;
  location: string | null;
  photos: unknown;
  product_ids: string[] | null;
  is_case_study: boolean;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};
