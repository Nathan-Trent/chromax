export type CertificationType = "iso" | "export_licence" | "msds" | "award" | "other";

export type CertificationRow = {
  id: string;
  name: string;
  cert_type: CertificationType;
  issuing_body: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  product_id: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};
