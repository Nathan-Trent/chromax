import { createClient } from "@/lib/supabase/server";
import type { CertificationRow } from "@/types/certification";

const CERT_COLUMNS =
  "id,name,cert_type,issuing_body,issue_date,expiry_date,document_url,product_id,display_order,active,created_at,updated_at" as const;

export interface PublicCertification {
  id: string;
  name: string;
  cert_type: string;
  issuing_body: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  active: boolean;
  display_order: number | null;
}

/** Display bucket keys returned by getCertificationsByType */
export type CertificationDisplayGroup =
  | "ISO"
  | "Export Licence"
  | "MSDS"
  | "Award"
  | "Other";

function mapRow(row: Record<string, unknown>): PublicCertification {
  const ord = row.display_order;
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    cert_type: String(row.cert_type ?? "other"),
    issuing_body: row.issuing_body != null ? String(row.issuing_body) : null,
    issue_date: row.issue_date != null ? String(row.issue_date) : null,
    expiry_date: row.expiry_date != null ? String(row.expiry_date) : null,
    document_url: row.document_url != null ? String(row.document_url) : null,
    active: Boolean(row.active),
    display_order:
      typeof ord === "number"
        ? ord
        : typeof ord === "string" && ord.trim()
          ? Number.parseInt(ord, 10)
          : null,
  };
}

function dbTypeToGroup(certType: string): CertificationDisplayGroup {
  switch (certType) {
    case "iso":
      return "ISO";
    case "export_licence":
      return "Export Licence";
    case "msds":
      return "MSDS";
    case "award":
      return "Award";
    default:
      return "Other";
  }
}

export const CERTIFICATION_DISPLAY_GROUPS: CertificationDisplayGroup[] = [
  "ISO",
  "Export Licence",
  "MSDS",
  "Award",
  "Other",
];

const GROUP_ORDER = CERTIFICATION_DISPLAY_GROUPS;

export async function getPublicCertifications(): Promise<PublicCertification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("certifications")
    .select(CERT_COLUMNS)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapRow);
}

export async function getCertificationsByType(): Promise<Record<string, PublicCertification[]>> {
  const list = await getPublicCertifications();
  const buckets: Partial<Record<CertificationDisplayGroup, PublicCertification[]>> = {};

  for (const c of list) {
    const g = dbTypeToGroup(c.cert_type);
    if (!buckets[g]) buckets[g] = [];
    buckets[g]!.push(c);
  }

  const out: Record<string, PublicCertification[]> = {};
  for (const g of GROUP_ORDER) {
    const arr = buckets[g];
    if (arr?.length) {
      out[g] = arr;
    }
  }
  return out;
}

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
