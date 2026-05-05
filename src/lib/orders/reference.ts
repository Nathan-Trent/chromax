import { createServiceRoleClient } from "@/lib/supabase/service";

function padSeq(n: number): string {
  return String(n).padStart(4, "0");
}

function parseSeq(reference: string, year: number, prefix: string): number | null {
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const m = reference.match(re);
  if (!m) return null;
  const x = parseInt(m[1] ?? "", 10);
  return Number.isNaN(x) ? null : x;
}

async function nextReference(prefix: "CX" | "B2B"): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;
  const supabase = createServiceRoleClient();

  const table = prefix === "CX" ? "orders" : "b2b_offers";

  const { data, error } = await supabase
    .from(table)
    .select("reference")
    .like("reference", `${pattern}%`);

  if (error) {
    throw new Error(`${prefix} reference query failed: ${error.message}`);
  }

  let maxSeq = 0;
  for (const row of data ?? []) {
    const ref = (row as { reference: string }).reference;
    if (!ref) continue;
    const seq = parseSeq(ref, year, prefix);
    if (seq != null && seq > maxSeq) maxSeq = seq;
  }

  const next = maxSeq + 1;
  return `${prefix}-${year}-${padSeq(next)}`;
}

export async function generateOrderReference(): Promise<string> {
  return nextReference("CX");
}

export async function generateB2BReference(): Promise<string> {
  return nextReference("B2B");
}
