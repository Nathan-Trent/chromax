import { BlogPostForm } from "@/components/admin/blog/BlogPostForm";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import { redirect } from "next/navigation";

export default async function AdminBlogNewPage() {
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

  if (!hasPermission(roles, "blog", "create")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">New post</h1>
      <div className="mt-8 max-w-3xl">
        <BlogPostForm mode="create" />
      </div>
    </div>
  );
}
