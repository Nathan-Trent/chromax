import { CertForm } from "@/components/admin/certifications/CertForm";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { getLiveProductsForSelect } from "@/lib/supabase/queries/products-admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import { redirect } from "next/navigation";

export default async function AdminCertificationNewPage() {
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

  if (!hasPermission(roles, "certifications", "edit")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const liveProducts = await getLiveProductsForSelect();

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">New certification</h1>
      <div className="mt-8 max-w-3xl">
        <CertForm mode="create" liveProducts={liveProducts} />
      </div>
    </div>
  );
}
