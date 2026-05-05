import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { OrderLineItem } from "@/types/order";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account/login?next=/account/orders");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("reference, created_at, items, total, currency, status, payment_status")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-sans text-2xl font-medium text-[#1a1a2e]">My Orders</h1>
      <p className="mt-1 font-sans text-sm text-[#555]">Your order history with Chromax-MCR</p>

      {!orders?.length ? (
        <div className="mt-10 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="font-sans text-[#555]">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--color-gold)] px-4 py-2 font-sans text-[13px] font-medium text-[var(--color-navy)] transition-colors hover:bg-[#D49215]"
          >
            Browse our products
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((row) => {
            const items = Array.isArray(row.items) ? (row.items as OrderLineItem[]) : [];
            const first = items[0]?.name ?? "Items";
            const more = items.length > 1 ? ` and ${items.length - 1} more` : "";
            return (
              <li key={row.reference} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-medium text-[#1a1a2e]">{row.reference}</p>
                    <p className="mt-1 font-sans text-xs text-[#888]">{formatOrderDate(row.created_at)}</p>
                    <p className="mt-2 font-sans text-sm text-[#555]">
                      {first}
                      {more}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-sm font-medium text-[#1a1a2e]">
                      {formatMoney(Number(row.total), row.currency)}
                    </p>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <Badge variant={orderStatusVariant(row.status)} size="sm" className="capitalize">
                        {row.status}
                      </Badge>
                    </div>
                    <Link
                      href={`/account/orders/${encodeURIComponent(row.reference)}`}
                      className="mt-3 inline-block font-sans text-sm font-medium text-[#185FA5] hover:underline"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
