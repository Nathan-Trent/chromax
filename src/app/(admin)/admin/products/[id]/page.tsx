import { ProductForm } from "@/components/admin/products/ProductForm";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { getAdminProductById } from "@/lib/supabase/queries/products-admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function AdminProductEditPage({ params }: Props) {
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

  if (!hasPermission(roles, "products", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const product = await getAdminProductById(id);
  if (!product) {
    notFound();
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-4 font-sans text-2xl font-semibold text-[#1a1a2e]">Edit product</h1>

      <div className="mb-6 rounded-xl bg-white p-4">
        <p className="font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Product overview
        </p>
        <dl className="mt-3 grid gap-2 font-sans text-sm text-[#555555] sm:grid-cols-2">
          <div>
            <dt className="text-[#888888]">Created</dt>
            <dd className="text-[#1a1a2e]">{fmtDate(product.created_at)}</dd>
          </div>
          <div>
            <dt className="text-[#888888]">Last updated</dt>
            <dd className="text-[#1a1a2e]">{fmtDate(product.updated_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[#888888]">ERP product ID</dt>
            <dd className="text-[#1a1a2e]">{product.erp_product_id?.trim() || "Not linked"}</dd>
          </div>
        </dl>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
        >
          View on site →
        </Link>
      </div>

      <ProductForm product={product} mode="edit" />
    </div>
  );
}
