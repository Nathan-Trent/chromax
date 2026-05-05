import { OrderErpSyncButton } from "@/components/admin/orders/OrderErpSyncButton";
import { OrderFulfilmentPanel } from "@/components/admin/orders/OrderFulfilmentPanel";
import { OrderStatusFlow } from "@/components/admin/orders/OrderStatusFlow";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import {
  getAdminOrderById,
  getCustomerAccountType,
  getLatestAuditSourceForRecord,
  hasPendingOrderCancellation,
} from "@/lib/supabase/queries/orders-admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminOrderRow, OrderLineItem, OrderStatus } from "@/types/order";
import type { Role } from "@/types/role";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

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

function formatLongDate(iso: string): string {
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

function formatAddress(addr: AdminOrderRow["shipping_address"]): string {
  if (!addr || typeof addr !== "object") return "—";
  const parts = [
    addr.line1,
    addr.line2,
    [addr.city, addr.postcode].filter(Boolean).join(" "),
    addr.country,
  ]
    .flat()
    .filter((p) => Boolean(p && String(p).trim()));
  return parts.length ? parts.join("\n") : "—";
}

function lineQty(item: OrderLineItem): number {
  const q = item.qty ?? item.quantity;
  return typeof q === "number" && Number.isFinite(q) ? q : 0;
}

function lineUnitPrice(item: OrderLineItem): number {
  const p = item.unit_price;
  if (typeof p === "number" && Number.isFinite(p)) return p;
  return 0;
}

export default async function AdminOrderDetailPage({ params }: Props) {
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

  if (!hasPermission(roles, "orders", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const order = await getAdminOrderById(id);
  if (!order) {
    notFound();
  }

  const [lastSource, pendingCancel, accountType] = await Promise.all([
    getLatestAuditSourceForRecord(order.id),
    hasPendingOrderCancellation(order.id),
    getCustomerAccountType(order.customer_id),
  ]);

  const canFulfil = hasPermission(roles, "orders", "fulfil");
  const canCancelRequest = hasPermission(roles, "orders", "cancel_request");
  const canCancelApprove = hasPermission(roles, "orders", "cancel_approve");

  const items: OrderLineItem[] = Array.isArray(order.items) ? order.items : [];

  const accountBadge = accountType ?? "guest";

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/admin/orders"
        className="mb-6 inline-block font-sans text-sm font-medium text-[#185FA5] hover:underline"
      >
        ← Orders
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <section className="mb-4 rounded-xl bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xl font-semibold text-[#1a1a2e] md:text-2xl">
                  {order.reference}
                </p>
                <p className="mt-2 font-sans text-sm text-[#888]">
                  Created {formatLongDate(order.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="navy" size="sm">
                  {order.source}
                </Badge>
              </div>
            </div>
            <p className="mt-4 font-sans text-sm text-[#555]">
              <span className="font-medium text-[#1a1a2e]">ERP sync: </span>
              {order.erp_synced_at ? formatLongDate(order.erp_synced_at) : "Not synced"}
            </p>
          </section>

          <section className="mb-4 rounded-xl bg-white p-6">
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Customer
            </p>
            <p className="font-sans text-[15px] font-medium text-[#1a1a2e]">{order.customer_name}</p>
            <a
              href={`mailto:${order.customer_email}`}
              className="mt-1 block font-sans text-sm text-[#185FA5] hover:underline"
            >
              {order.customer_email}
            </a>
            {order.customer_phone ? (
              <p className="mt-2 font-sans text-sm text-[#555]">{order.customer_phone}</p>
            ) : null}
            <p className="mt-2 font-sans text-sm text-[#555]">
              {(order.shipping_address as { country?: string })?.country ?? "—"}
            </p>
            <Badge variant="default" size="sm" className="mt-3 capitalize">
              {accountBadge === "guest" ? "Guest checkout" : `${accountBadge} account`}
            </Badge>
          </section>

          <section className="mb-4 rounded-xl bg-white p-6">
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Shipping address
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#555]">
              {formatAddress(order.shipping_address)}
            </pre>
          </section>

          <section className="mb-4 rounded-xl bg-white p-6">
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Items ordered
            </p>
            <div className="overflow-x-auto">
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.HeadCell>Product</Table.HeadCell>
                    <Table.HeadCell>Variant</Table.HeadCell>
                    <Table.HeadCell align="right">Qty</Table.HeadCell>
                    <Table.HeadCell align="right">Unit price</Table.HeadCell>
                    <Table.HeadCell align="right">Subtotal</Table.HeadCell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {items.map((line, idx) => {
                    const q = lineQty(line);
                    const unit = lineUnitPrice(line);
                    const sub = q * unit;
                    return (
                      <Table.Row key={idx}>
                        <Table.Cell className="font-sans text-[13px]">{line.name}</Table.Cell>
                        <Table.Cell className="font-sans text-sm text-[#666]">
                          {line.variant ?? "—"}
                        </Table.Cell>
                        <Table.Cell align="right">{q}</Table.Cell>
                        <Table.Cell align="right">
                          {formatMoney(unit, order.currency)}
                        </Table.Cell>
                        <Table.Cell align="right" className="font-medium">
                          {formatMoney(sub, order.currency)}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
            <div className="mt-4 flex justify-end border-t border-[#E8E8E4] pt-4">
              <p className="font-sans text-base font-semibold text-[#1a1a2e]">
                Total {formatMoney(Number(order.total), order.currency)}
              </p>
            </div>
            <p className="mt-4 font-sans text-sm text-[#555]">
              Payment:{" "}
              <span className="font-medium capitalize text-[#1a1a2e]">
                {order.payment_method ?? "—"}
              </span>
              {order.payment_ref ? (
                <>
                  {" "}
                  · Ref <span className="font-mono text-xs">{order.payment_ref}</span>
                </>
              ) : null}
            </p>
          </section>
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            <section className="rounded-xl bg-white p-6">
              <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                Order status
              </p>
              <Badge variant={orderStatusVariant(order.status)} size="md">
                {order.status}
              </Badge>
              <div className="mt-6">
                <OrderStatusFlow status={order.status as OrderStatus} />
              </div>
              <div className="mt-8">
                <OrderFulfilmentPanel
                  orderId={order.id}
                  status={order.status}
                  customerEmail={order.customer_email}
                  trackingNumber={order.tracking_number}
                  courier={order.courier}
                  canFulfil={canFulfil}
                  canCancelRequest={canCancelRequest}
                  canCancelApprove={canCancelApprove}
                  hasPendingCancel={pendingCancel}
                />
              </div>
            </section>

            <section className="rounded-xl bg-white p-6">
              <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                ERP sync
              </p>
              <p className="font-sans text-sm text-[#555]">
                Last synced:{" "}
                <span className="text-[#1a1a2e]">
                  {order.erp_synced_at ? formatLongDate(order.erp_synced_at) : "Never"}
                </span>
              </p>
              <p className="mt-2 font-sans text-sm text-[#555]">
                Source of last update:{" "}
                <span className="font-medium capitalize text-[#1a1a2e]">
                  {lastSource ?? "—"}
                </span>
              </p>
              <div className="mt-4">
                <OrderErpSyncButton orderId={order.id} reference={order.reference} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
