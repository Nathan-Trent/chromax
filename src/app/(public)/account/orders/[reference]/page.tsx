import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { OrderLineItem, ShippingAddressJson } from "@/types/order";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

function payVariant(
  s: string,
): "blue" | "teal" | "amber" | "purple" | "green" | "coral" | "default" {
  if (s === "paid") return "teal";
  if (s === "pending") return "amber";
  if (s === "failed" || s === "refunded") return "coral";
  return "default";
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

function formatAddress(a: ShippingAddressJson | Record<string, unknown> | null): string {
  if (!a || typeof a !== "object") return "—";
  const parts = [
    (a as ShippingAddressJson).line1,
    (a as ShippingAddressJson).line2,
    (a as ShippingAddressJson).city,
    (a as ShippingAddressJson).postcode,
    (a as ShippingAddressJson).country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default async function AccountOrderDetailPage({
  params,
}: Readonly<{
  params: Promise<{ reference: string }>;
}>) {
  const { reference: refParam } = await params;
  const reference = decodeURIComponent(refParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/account/login?next=/account/orders/${encodeURIComponent(reference)}`);
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("reference", reference)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const items = Array.isArray(order.items) ? (order.items as OrderLineItem[]) : [];
  const currency = order.currency as string;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/account/orders" className="font-sans text-sm font-medium text-[#185FA5] hover:underline">
        ← My orders
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-medium text-[#1a1a2e]">{order.reference}</h1>
        <Badge variant={orderStatusVariant(order.status)} className="capitalize">
          {order.status}
        </Badge>
        <Badge variant={payVariant(order.payment_status)} size="sm" className="capitalize">
          {order.payment_status}
        </Badge>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full border-collapse font-sans text-sm">
          <thead className="bg-[#F5F0E8] text-left text-[11px] font-medium uppercase tracking-wide text-[#633806]">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Unit</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((line, i) => {
              const qty = Number(line.qty ?? line.quantity ?? 1);
              const unit = Number(line.unit_price ?? 0);
              const sub = qty * unit;
              return (
                <tr key={i} className="border-t border-[#F0EDE6]">
                  <td className="px-4 py-3 text-[#1a1a2e]">{line.name}</td>
                  <td className="px-4 py-3 text-[#555]">{line.variant ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{qty}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(unit, currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatMoney(sub, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E8E8E4] bg-[#FDFCF8]">
              <td colSpan={4} className="px-4 py-3 text-right font-medium text-[#1a1a2e]">
                Total
              </td>
              <td className="px-4 py-3 text-right font-semibold text-[#1a1a2e]">
                {formatMoney(Number(order.total), currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-sans text-sm font-medium text-[#1a1a2e]">Shipping address</h2>
        <p className="mt-2 font-sans text-sm text-[#555]">
          {formatAddress(order.shipping_address as ShippingAddressJson)}
        </p>
        {order.status === "dispatched" || order.status === "delivered" ? (
          <div className="mt-4 font-sans text-sm text-[#555]">
            {order.tracking_number ? (
              <p>
                Tracking ({order.courier ?? "Carrier"}):{" "}
                <span className="font-mono font-medium text-[#1a1a2e]">{order.tracking_number}</span>
              </p>
            ) : null}
            {order.status === "delivered" ? (
              <p className="mt-2 font-medium text-[#1D9E75]">Delivered — thank you for your order.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
