import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { CertificationRow, CertificationType } from "@/types/certification";
import type { Role } from "@/types/role";
import Link from "next/link";
import { redirect } from "next/navigation";

const GROUP_ORDER: CertificationType[] = [
  "iso",
  "export_licence",
  "msds",
  "award",
  "other",
];

const TYPE_LABEL: Record<CertificationType, string> = {
  iso: "ISO",
  export_licence: "Export Licence",
  msds: "MSDS",
  award: "Award",
  other: "Other",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  } catch {
    return "—";
  }
}

export default async function AdminCertificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(`roles ( id, name, description, permissions, is_system )`)
    .eq("user_id", user.id);
  const roles: Role[] = parseUserRoleRows(userRoleRows ?? []);

  if (!hasPermission(roles, "certifications", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const { data: rows, error } = await supabase
    .from("certifications")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const certs = (rows ?? []) as unknown as CertificationRow[];
  const productIds = [...new Set(certs.map((c) => c.product_id).filter(Boolean))] as string[];

  const productNameById = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: prods } = await supabase.from("products").select("id, name").in("id", productIds);
    for (const p of prods ?? []) {
      if (p.id && typeof p.name === "string") {
        productNameById.set(p.id, p.name);
      }
    }
  }

  const byType = new Map<CertificationType, CertificationRow[]>();
  for (const t of GROUP_ORDER) {
    byType.set(t, []);
  }
  for (const c of certs) {
    const list = byType.get(c.cert_type);
    if (list) list.push(c);
  }

  const canEdit = hasPermission(roles, "certifications", "edit");

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Certifications</h1>
          <p className="mt-1 font-sans text-sm text-[#888888]">
            Compliance documents and awards, grouped by type.
          </p>
        </div>
        {canEdit ? (
          <Link href="/admin/certifications/new">
            <Button type="button">Add certification</Button>
          </Link>
        ) : null}
      </div>

      <div className="space-y-10">
        {GROUP_ORDER.map((type) => {
          const list = byType.get(type) ?? [];
          if (list.length === 0) {
            return null;
          }
          return (
            <section key={type}>
              <h2 className="mb-3 font-sans text-lg font-medium text-[#1a1a2e]">{TYPE_LABEL[type]}</h2>
              <div>
                {list.map((c) => (
                  <div
                    key={c.id}
                    className="mb-3 rounded-xl border border-[#E8E8E4] bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-sans text-base font-semibold text-[#1a1a2e]">{c.name}</p>
                        {c.issuing_body ? (
                          <p className="mt-1 font-sans text-sm text-[#666]">{c.issuing_body}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-[#555]">
                          <span>
                            Issue: <span className="font-medium">{formatDate(c.issue_date)}</span>
                          </span>
                          <span>
                            Expiry: <span className="font-medium">{formatDate(c.expiry_date)}</span>
                          </span>
                          {c.product_id ? (
                            <span>
                              Product:{" "}
                              <span className="font-medium">
                                {productNameById.get(c.product_id) ?? c.product_id.slice(0, 8)}
                              </span>
                            </span>
                          ) : (
                            <span className="font-medium text-[#185FA5]">Company-wide</span>
                          )}
                        </div>
                        {c.document_url ? (
                          <a
                            href={c.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                          >
                            Document link →
                          </a>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={c.active ? "teal" : "default"} size="md">
                          {c.active ? "Active" : "Inactive"}
                        </Badge>
                        {canEdit ? (
                          <Link
                            href={`/admin/certifications/${c.id}`}
                            className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                          >
                            Edit →
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {certs.length === 0 ? (
        <p className="mt-8 text-center font-sans text-sm text-[#888]">No certifications yet.</p>
      ) : null}
    </div>
  );
}
