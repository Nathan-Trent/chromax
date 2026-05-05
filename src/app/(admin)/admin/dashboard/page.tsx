import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import {
  hasAnyContentNavPermission,
  hasPermission,
  isSuperAdmin,
} from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function greetingPrefix(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

function formatTimeSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
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
      `
      roles (
        id,
        name,
        description,
        permissions,
        is_system
      )
    `,
    )
    .eq("user_id", user.id);

  const roles = parseUserRoleRows(userRoleRows ?? []);

  const userIsSuperAdmin = isSuperAdmin(roles);
  const canOrdersView = hasPermission(roles, "orders", "view");
  const canB2bView = hasPermission(roles, "b2b", "view");
  const contentNav = hasAnyContentNavPermission(roles);
  const emailFirst = user.email.split("@")[0] ?? user.email;

  const showKpis = userIsSuperAdmin || canOrdersView;

  const startToday = startOfTodayISO();

  const newOrdersTodayPromise = showKpis
    ? supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startToday)
        .eq("status", "new")
    : Promise.resolve({ count: null } as { count: number | null });

  const pendingB2bPromise = showKpis
    ? supabase
        .from("b2b_offers")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
    : Promise.resolve({ count: null } as { count: number | null });

  const lowStockPromise = showKpis
    ? supabase
        .from("products")
        .select("id, stock, low_threshold")
        .eq("status", "live")
    : Promise.resolve({ data: null } as {
        data: { id: string; stock: number; low_threshold: number }[] | null;
      });

  const liveProductsPromise = showKpis
    ? supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "live")
    : Promise.resolve({ count: null } as { count: number | null });

  const recentOrdersPromise = canOrdersView
    ? supabase
        .from("orders")
        .select("id, reference, customer_name, customer_email, total, currency, status")
        .order("created_at", { ascending: false })
        .limit(5)
    : Promise.resolve({ data: null });

  const pendingB2bListPromise = canB2bView
    ? supabase
        .from("b2b_offers")
        .select("id, buyer_company, product_name, offered_price, currency, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(3)
    : Promise.resolve({ data: null });

  const contentOnly =
    contentNav && !canOrdersView && !canB2bView;

  const missingTdsPromise = contentOnly
    ? supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "live")
        .is("tds_url", null)
    : Promise.resolve({ count: null } as { count: number | null });

  const draftBlogPromise = contentOnly
    ? supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft")
    : Promise.resolve({ count: null } as { count: number | null });

  const missionOnly =
    !userIsSuperAdmin &&
    !contentNav &&
    !canOrdersView &&
    !canB2bView;

  const [
    newOrdersToday,
    pendingB2b,
    lowStock,
    liveProducts,
    recentOrders,
    pendingB2bList,
    missingTds,
    draftBlog,
  ] = await Promise.all([
    newOrdersTodayPromise,
    pendingB2bPromise,
    lowStockPromise,
    liveProductsPromise,
    recentOrdersPromise,
    pendingB2bListPromise,
    missingTdsPromise,
    draftBlogPromise,
  ]);

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">Dashboard</h1>
      <p className="mt-1 font-sans text-2xl font-semibold text-[#1a1a2e]">
        {greetingPrefix()}, {emailFirst}
      </p>

      {missionOnly ? (
        <div className="mt-8 max-w-2xl rounded-xl bg-[#1a1a2e] p-8 text-white">
          <p className="font-sans text-lg font-medium">Chromax-MCR Industrial Coatings</p>
          <p className="mt-4 font-sans text-sm leading-relaxed text-white/85">
            Mission: To manufacture world-class protective coatings that safeguard infrastructure,
            vessels and structures across Nigeria and beyond.
          </p>
        </div>
      ) : null}

      {!missionOnly && showKpis ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
            <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888888]">
              New orders today
            </p>
            <p className="mt-2 font-sans text-2xl font-semibold text-[#1a1a2e]">
              {newOrdersToday.count ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
            <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888888]">
              Pending B2B offers
            </p>
            <p className="mt-2 font-sans text-2xl font-semibold text-[#1a1a2e]">
              {pendingB2b.count ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
            <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888888]">
              Low stock products
            </p>
            <p className="mt-2 font-sans text-2xl font-semibold text-[#1a1a2e]">
              {Array.isArray(lowStock.data)
                ? lowStock.data.filter((p) => p.stock <= p.low_threshold).length
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
            <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888888]">
              Live products
            </p>
            <p className="mt-2 font-sans text-2xl font-semibold text-[#1a1a2e]">
              {liveProducts.count ?? "—"}
            </p>
          </div>
        </div>
      ) : null}

      {canOrdersView && recentOrders.data && recentOrders.data.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-sans text-lg font-medium text-[#1a1a2e]">Recent orders</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Reference</Table.HeadCell>
                  <Table.HeadCell>Customer</Table.HeadCell>
                  <Table.HeadCell align="right">Total</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                  <Table.HeadCell align="right">Action</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {recentOrders.data.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell>{row.reference}</Table.Cell>
                    <Table.Cell>{row.customer_name || row.customer_email}</Table.Cell>
                    <Table.Cell align="right">
                      {formatMoney(Number(row.total), row.currency)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={orderStatusVariant(row.status)}>{row.status}</Badge>
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
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      ) : null}

      {canB2bView && pendingB2bList.data && pendingB2bList.data.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-sans text-lg font-medium text-[#1a1a2e]">Pending B2B offers</h2>
          <ul className="mt-4 space-y-3">
            {pendingB2bList.data.map((offer) => (
              <li
                key={offer.id}
                className="rounded-xl border border-[#E8E8E4] bg-white p-4 md:p-5"
              >
                <p className="font-sans text-sm font-medium text-[#1a1a2e]">
                  {offer.buyer_company?.trim() || "—"}
                </p>
                <p className="mt-1 font-sans text-sm text-[#555555]">{offer.product_name}</p>
                <p className="mt-2 font-sans text-sm text-[#555555]">
                  Offered:{" "}
                  <span className="font-medium text-[#1a1a2e]">
                    {formatMoney(Number(offer.offered_price), offer.currency)}
                  </span>
                  <span className="text-[#888888]"> · {formatTimeSince(offer.created_at)}</span>
                </p>
                <Link
                  href={`/admin/b2b/${offer.id}`}
                  className="mt-3 inline-block font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                >
                  Respond →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {contentOnly ? (
        <div className="mt-10 space-y-8">
          <div className="max-w-2xl rounded-xl bg-[#1a1a2e] p-8 text-white">
            <p className="font-sans text-lg font-medium">Chromax-MCR Industrial Coatings</p>
            <p className="mt-4 font-sans text-sm leading-relaxed text-white/85">
              Mission: To manufacture world-class protective coatings that safeguard infrastructure,
              vessels and structures across Nigeria and beyond.
            </p>
          </div>
          <div className="max-w-xl rounded-xl border border-[#E8E8E4] bg-white p-6">
            <h2 className="font-sans text-lg font-medium text-[#1a1a2e]">Content tasks</h2>
            <ul className="mt-4 space-y-3 font-sans text-sm text-[#555555]">
              <li>
                Products missing TDS:{" "}
                <span className="font-semibold text-[#1a1a2e]">{missingTds.count ?? 0}</span>
              </li>
              <li>
                Draft blog posts waiting:{" "}
                <span className="font-semibold text-[#1a1a2e]">{draftBlog.count ?? 0}</span>
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
