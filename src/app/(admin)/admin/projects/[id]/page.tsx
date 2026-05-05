import { ProjectForm } from "@/components/admin/projects/ProjectForm";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { ProjectRow } from "@/types/project";
import type { Role } from "@/types/role";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProjectEditPage({ params }: Props) {
  const { id } = await params;
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

  if (!hasPermission(roles, "projects", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!project) {
    notFound();
  }

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/admin/projects"
        className="mb-6 inline-block font-sans text-sm font-medium text-[#185FA5] hover:underline"
      >
        ← Projects
      </Link>
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Edit project</h1>
      <div className="mt-8 max-w-3xl">
        <ProjectForm mode="edit" project={project as unknown as ProjectRow} />
      </div>
    </div>
  );
}
