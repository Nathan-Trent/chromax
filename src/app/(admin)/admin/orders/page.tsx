import { OrderAdminFilters } from "@/components/admin/orders/OrderAdminFilters";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { getAdminOrders } from "@/lib/supabase/queries/orders-admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminOrderRow, OrderCurrency, OrderStatus } from "@/types/order";
import type { Role } from "@/types/role";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

const PAGE_SIZE = 20;

type PageSearch = {
  status?: string;
  currency?: string;
  search?: string;
  customer?: string;
  page?: string;
};

function parseListParams(sp: PageSearch): Parameters<typeof getAdminOrders>[0] {
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.search?.trim() || undefined;
  const customerEmail = sp.customer?.trim() || undefined;
  const status =
    sp.status === "new" ||
    sp.status === "confirmed" ||
    sp.status === "packed" ||
    sp.status === "dispatched" ||
    sp.status === "delivered" ||
    sp.status === "cancelled"
      ? (sp.status as OrderStatus)
      : "all";
  const currency =
    sp.currency === "NGN" || sp.currency === "USD" || sp.currency === "GBP"
      ? (sp.currency as OrderCurrency)
      : "all";

  return { status, currency, search, customerEmail, page, limit: PAGE_SIZE };
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function orderStatusVariant(
  status: string,
): "blue" | "teal" | "amber" | "purple" | "green" | "coral" | "default" {
  switch (status) {
    case "new":
      return "blue";
    case "confirmed":
      return "teal";
    case "packed":
      return "amber";
    case "dispatched":
      return "purple";
    case "delivered":
      return "green";
    case "cancelled":
      return "coral";
    default:
      return "default";
  }
}

function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function hrefForPage(sp: PageSearch, p: number) {
  const params = new URLSearchParams();
  if (sp.status && sp.status !== "all") params.set("status", sp.status);
  if (sp.currency && sp.currency !== "all") params.set("currency", sp.currency);
  if (sp.search?.trim()) params.set("search", sp.search.trim());
  if (sp.customer?.trim()) params.set("customer", sp.customer.trim());
  if (p > 1) params.set("page", String(p));
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

function isStalled(row: AdminOrderRow): boolean {
  if (row.status === "delivered" || row.status === "cancelled") return false;
  const t = new Date(row.updated_at).getTime();
  return Number.isFinite(t) && Date.now() - t > 24 * 60 * 60 * 1000;
}

export default async function AdminOrdersPage({
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
    .select(`roles ( id, name, description, permissions, is_system )`)
    .eq("user_id", user.id);
  const roles: Role[] = parseUserRoleRows(userRoleRows ?? []);

  if (!hasPermission(roles, "orders", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const filters = parseListParams(sp);
  const { orders, total } = await getAdminOrders(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = filters.page ?? 1;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Orders</h1>
        <p className="mt-1 font-sans text-sm text-[#888888]">
          Manage and fulfil customer orders
        </p>
      </div>

      <Suspense fallback={<div className="mb-6 h-24 rounded-xl border border-[#E8E8E4] bg-white" />}>
        <OrderAdminFilters />
      </Suspense>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-[#E8E8E4] bg-white py-16 text-center">
          <p className="font-sans text-[#888888]">No orders yet</p>
        </div>
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-x-auto sm:px-0">
            <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
              <Table className="min-w-[640px]">
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Reference</Table.HeadCell>
                  <Table.HeadCell>Customer</Table.HeadCell>
                  <Table.HeadCell align="right">Value</Table.HeadCell>
                  <Table.HeadCell>Currency</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                  <Table.HeadCell>Date</Table.HeadCell>
                  <Table.HeadCell align="right">Action</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {orders.map((row) => {
                  const international = row.currency !== "NGN";
                  const stalled = isStalled(row);
                  return (
                    <Table.Row
                      key={row.id}
                      className={stalled ? "bg-[#FAEEDA]/60" : undefined}
                    >
                      <Table.Cell>
                        <span className="flex items-center gap-1.5 font-mono text-[13px] font-medium text-[#1a1a2e]">
                          {international ? <span aria-hidden>🌍</span> : null}
                          {stalled ? <span aria-hidden title="No update in 24h">⚠</span> : null}
                          {row.reference}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="font-sans text-[13px] font-medium text-[#1a1a2e]">
                          {row.customer_name}
                        </p>
                        <p className="font-sans text-xs text-[#888]">{row.customer_email}</p>
                      </Table.Cell>
                      <Table.Cell align="right" className="font-sans text-[13px]">
                        {formatMoney(Number(row.total), row.currency)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant="default" size="sm">
                          {row.currency}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={orderStatusVariant(row.status)}>{row.status}</Badge>
                      </Table.Cell>
                      <Table.Cell className="font-sans text-[13px] text-[#555]">
                        {formatOrderDate(row.created_at)}
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Link
                          href={`/admin/orders/${row.id}`}
                          className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                        >
                          View →
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
              </Table>
            </div>
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
