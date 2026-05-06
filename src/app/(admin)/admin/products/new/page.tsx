import { ProductForm } from "@/components/admin/products/ProductForm";
import { hasPermission } from "@/lib/auth/permissions";
import { getERPHealth } from "@/lib/erp/client";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import { redirect } from "next/navigation";

export default async function AdminNewProductPage() {
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

  if (!hasPermission(roles, "products", "create")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const erpConnected = await Promise.race([
    getERPHealth()
      .then((h) => h.status === "ok")
      .catch(() => false),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 3000);
    }),
  ]);
  const canErpView = hasPermission(roles, "erp_sync", "view");

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 font-sans text-2xl font-semibold text-[#1a1a2e]">New product</h1>
      <ProductForm mode="create" erpConnected={erpConnected} canErpView={canErpView} />
    </div>
  );
}
