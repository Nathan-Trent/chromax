import { ProductAdminFilters } from "@/components/admin/products/ProductAdminFilters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { hasPermission } from "@/lib/auth/permissions";
import { getERPHealth } from "@/lib/erp/client";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import type { Product, ProductCategory } from "@/lib/supabase/queries/products";
import { getAdminProducts } from "@/lib/supabase/queries/products-admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/role";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

const PAGE_SIZE = 20;

type PageSearch = {
  category?: string;
  status?: string;
  search?: string;
  page?: string;
};

function parseListParams(sp: PageSearch): Parameters<typeof getAdminProducts>[0] {
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.search?.trim() || undefined;
  const category =
    sp.category === "industrial" ||
    sp.category === "marine" ||
    sp.category === "automotive" ||
    sp.category === "architectural" ||
    sp.category === "custom"
      ? (sp.category as ProductCategory)
      : undefined;
  const status =
    sp.status === "draft" || sp.status === "live" || sp.status === "archived"
      ? sp.status
      : undefined;

  return { category, status, search, page, limit: PAGE_SIZE };
}

function productThumbUrl(p: Product): string | null {
  const imgs = p.images;
  if (!imgs?.length) return null;
  const primary = imgs.find((i) => i.is_primary);
  return (primary ?? imgs[0]).url;
}

function formatNgn(n: number | null): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₦${n}`;
  }
}

function statusVariant(s: Product["status"]): "teal" | "blue" | "default" {
  if (s === "live") return "teal";
  if (s === "draft") return "blue";
  return "default";
}

function stockClass(stock: number, low: number): string {
  if (stock === 0) return "text-[#A32D2D] font-medium";
  if (stock <= low) return "text-[#BA7517] font-medium";
  return "text-[#0F6E56] font-medium";
}

function hrefForPage(sp: PageSearch, p: number) {
  const params = new URLSearchParams();
  if (sp.category) params.set("category", sp.category);
  if (sp.status) params.set("status", sp.status);
  if (sp.search?.trim()) params.set("search", sp.search.trim());
  if (p > 1) params.set("page", String(p));
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearch>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(
      `roles (
      id, name, description, permissions, is_system
    )`,
    )
    .eq("user_id", user.id);
  const roles: Role[] = parseUserRoleRows(userRoleRows ?? []);

  if (!hasPermission(roles, "products", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const filters = parseListParams(sp);
  const { products, total } = await getAdminProducts(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = filters.page ?? 1;
  const canCreate = hasPermission(roles, "products", "create");

  const erpConnected = await Promise.race([
    getERPHealth()
      .then((h) => h.status === "ok")
      .catch(() => false),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 3000);
    }),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Products</h1>
          <p className="mt-1 font-sans text-sm text-[#888888]">Manage your product catalogue</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={[
                "h-2 w-2 rounded-full",
                erpConnected ? "bg-[#0F6E56]" : "bg-[#BBBBBB]",
              ].join(" ")}
              aria-hidden
            />
            <span
              className={[
                "font-sans text-xs",
                erpConnected ? "text-[#0F6E56]" : "text-[#888888]",
              ].join(" ")}
            >
              {erpConnected ? "ERP connected" : "ERP not connected"}
            </span>
          </div>
        </div>
        {canCreate ? (
          <Link href="/admin/products/new">
            <Button type="button">Add product</Button>
          </Link>
        ) : null}
      </div>

      <Suspense fallback={<div className="mb-6 h-24 rounded-xl border border-[#E8E8E4] bg-white" />}>
        <ProductAdminFilters />
      </Suspense>

      {products.length === 0 ? (
        <div className="rounded-xl border border-[#E8E8E4] bg-white py-16 text-center">
          <p className="font-sans text-[#888888]">No products found</p>
          {canCreate ? (
            <Link href="/admin/products/new" className="mt-6 inline-block">
              <Button type="button">Add your first product</Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Product</Table.HeadCell>
                  <Table.HeadCell align="right">Stock</Table.HeadCell>
                  <Table.HeadCell align="right">Price NGN</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                  <Table.HeadCell>TDS</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {products.map((row) => {
                  const thumb = productThumbUrl(row);
                  return (
                    <Table.Row key={row.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F0EDE6]">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-sans text-[13px] font-medium text-[#1a1a2e] truncate">
                              {row.name}
                            </p>
                            <Badge variant="default" size="sm" className="mt-1 capitalize">
                              {row.category}
                            </Badge>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <span className={stockClass(row.stock, row.low_threshold)}>{row.stock}</span>
                      </Table.Cell>
                      <Table.Cell align="right" className="font-sans text-[13px]">
                        {formatNgn(row.price_ngn)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {row.tds_url ? (
                          <span className="text-[#1D9E75] font-medium" aria-label="TDS present">
                            ✓
                          </span>
                        ) : (
                          <span className="font-sans text-xs text-[#BA7517]">Missing</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/products/${row.id}`}
                            className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                          >
                            Edit
                          </Link>
                          <a
                            href={`/products/${row.slug}`}
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
          {totalPages > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {page > 1 ? (
                <Link
                  href={hrefForPage(sp, page - 1)}
                  className="font-sans text-sm font-medium text-[#185FA5] hover:underline"
                >
                  ← Previous
                </Link>
              ) : null}
              <span className="font-sans text-sm text-[#666]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={hrefForPage(sp, page + 1)}
                  className="font-sans text-sm font-medium text-[#185FA5] hover:underline"
                >
                  Next →
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
