import { createClient } from "@/lib/supabase/server";
import type { CertificationRow } from "@/types/certification";

const CERT_COLUMNS =
  "id,name,cert_type,issuing_body,issue_date,expiry_date,document_url,product_id,display_order,active,created_at,updated_at" as const;

export async function getActiveCertifications(limit = 4): Promise<CertificationRow[]> {
  const supabase = await createClient();
  const lim = Math.min(24, Math.max(1, limit));

  const { data, error } = await supabase
    .from("certifications")
    .select(CERT_COLUMNS)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .limit(lim);

  if (error) {
    throw new Error(`getActiveCertifications failed: ${error.message}`);
  }

  return (data ?? []) as CertificationRow[];
}
