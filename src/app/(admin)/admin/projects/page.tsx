import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { ProjectRow, ProjectStatus } from "@/types/project";
import type { Role } from "@/types/role";
import Link from "next/link";
import { redirect } from "next/navigation";

function statusVariant(s: ProjectStatus): "blue" | "teal" | "amber" | "default" {
  if (s === "live") return "teal";
  if (s === "draft") return "blue";
  return "default";
}

export default async function AdminProjectsPage() {
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

  const { data: rows, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const projects = (rows ?? []) as unknown as ProjectRow[];
  const canEdit = hasPermission(roles, "projects", "edit");

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Projects</h1>
          <p className="mt-1 font-sans text-sm text-[#888888]">Case studies and portfolio entries.</p>
        </div>
        {canEdit ? (
          <Link href="/admin/projects/new">
            <Button type="button">Add project</Button>
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeadCell>Title</Table.HeadCell>
              <Table.HeadCell>Sector</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {projects.map((p) => (
              <Table.Row key={p.id}>
                <Table.Cell className="font-sans text-[13px] font-medium text-[#1a1a2e]">{p.title}</Table.Cell>
                <Table.Cell className="font-sans text-sm capitalize text-[#555]">{p.sector ?? "—"}</Table.Cell>
                <Table.Cell>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                    >
                      Edit
                    </Link>
                    <a
                      href="/projects"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                    >
                      View
                    </a>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 text-center font-sans text-sm text-[#888]">No projects yet.</p>
      ) : null}
    </div>
  );
}
