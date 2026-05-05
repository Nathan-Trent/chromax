import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { BlogPostRow, BlogPostStatus } from "@/types/blog-post";
import type { Role } from "@/types/role";
import Link from "next/link";
import { redirect } from "next/navigation";

function postStatusVariant(
  s: BlogPostStatus,
): "blue" | "teal" | "amber" | "purple" | "green" | "coral" | "default" {
  if (s === "live") return "teal";
  if (s === "draft") return "blue";
  if (s === "archived") return "default";
  return "default";
}

function formatPub(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default async function AdminBlogPage() {
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

  if (!hasPermission(roles, "blog", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const posts = (rows ?? []) as unknown as BlogPostRow[];
  const canCreate = hasPermission(roles, "blog", "create");

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Blog &amp; Guides</h1>
          <p className="mt-1 font-sans text-sm text-[#888888]">Manage articles and guides.</p>
        </div>
        {canCreate ? (
          <Link href="/admin/blog/new">
            <Button type="button">Add post</Button>
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeadCell>Title</Table.HeadCell>
              <Table.HeadCell>Type</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Author</Table.HeadCell>
              <Table.HeadCell>Published</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {posts.map((p) => {
              const t = p.post_type;
              return (
                <Table.Row key={p.id}>
                  <Table.Cell className="font-sans text-[13px] font-medium text-[#1a1a2e]">{p.title}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={t === "guide" ? "purple" : "blue"} size="sm">
                      {t === "guide" ? "Guide" : "Blog"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={postStatusVariant(p.status)}>{p.status}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-sans text-sm text-[#555]">
                    {p.author_name ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="font-sans text-sm text-[#666]">
                    {formatPub(p.published_at)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/blog/${p.id}`}
                        className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                      >
                        Edit
                      </Link>
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </div>

      {posts.length === 0 ? (
        <p className="mt-8 text-center font-sans text-sm text-[#888]">No posts yet.</p>
      ) : null}
    </div>
  );
}
