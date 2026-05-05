import { Badge } from "@/components/ui/Badge";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import {
  displayTitleForPageKey,
  getContentPagesByKeys,
  getLastEditorEmailsForContentPageIds,
} from "@/lib/supabase/queries/content-admin";
import { createClient } from "@/lib/supabase/server";
import type { ContentPageRow } from "@/types/content-page";
import type { Role } from "@/types/role";
import Link from "next/link";
import { redirect } from "next/navigation";

const KEYS = ["homepage", "about", "contact"] as const;

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminContentPage() {
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

  if (!hasPermission(roles, "content", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const rows = await getContentPagesByKeys(KEYS);
  const byKey = new Map(rows.map((r) => [r.page_key, r]));
  const editorEmails = await getLastEditorEmailsForContentPageIds(rows.map((r) => r.id));

  function rowFor(key: string): ContentPageRow | undefined {
    return byKey.get(key);
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Pages &amp; content</h1>
      <p className="mt-1 font-sans text-sm text-[#888888]">Edit marketing copy for main pages.</p>

      <div className="mt-8 max-w-2xl">
        {KEYS.map((key) => {
          const row = rowFor(key);
          const st = row?.status ?? "draft";
          const badgeVariant = st === "live" ? "teal" : "blue";
          const editedBy = row ? editorEmails[row.id] ?? null : null;
          return (
            <div key={key} className="mb-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E8E8E4]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-sans text-lg font-semibold text-[#1a1a2e]">
                    {displayTitleForPageKey(key)}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={badgeVariant}>{row ? st : "draft"}</Badge>
                  </div>
                  <p className="mt-3 font-sans text-sm text-[#888]">
                    {row ? (
                      <>
                        Last edited: {formatDate(row.updated_at)}
                        {editedBy ? ` by ${editedBy}` : null}
                      </>
                    ) : (
                      <>Not created yet — open editor to initialise.</>
                    )}
                  </p>
                </div>
                <Link
                  href={`/admin/content/${key}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-2 font-sans text-[13px] font-medium text-[var(--color-navy)] transition-colors hover:bg-[#D49215]"
                >
                  Edit content →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
