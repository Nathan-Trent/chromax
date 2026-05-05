import { B2BAdminFilters } from "@/components/admin/b2b/B2BAdminFilters";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import {
  getAdminB2bOffers,
  getB2bAdminStats,
  type B2BAdminStats,
} from "@/lib/supabase/queries/b2b-admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminB2BOfferRow, B2BOfferCurrency, B2BOfferStatus } from "@/types/b2b-offer";
import type { Role } from "@/types/role";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

type PageSearch = {
  status?: string;
  currency?: string;
};

function parseFilters(sp: PageSearch): Parameters<typeof getAdminB2bOffers>[0] {
  const status =
    sp.status === "pending" ||
    sp.status === "reviewing" ||
    sp.status === "countered" ||
    sp.status === "accepted" ||
    sp.status === "declined" ||
    sp.status === "expired" ||
    sp.status === "converted"
      ? (sp.status as B2BOfferStatus)
      : "all";
  const currency =
    sp.currency === "NGN" || sp.currency === "USD" || sp.currency === "GBP"
      ? (sp.currency as B2BOfferCurrency)
      : "all";
  return { status, currency };
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

function b2bStatusVariant(
  status: string,
): "blue" | "teal" | "amber" | "purple" | "green" | "coral" | "default" {
  switch (status) {
    case "pending":
      return "amber";
    case "reviewing":
      return "blue";
    case "countered":
      return "purple";
    case "accepted":
      return "teal";
    case "declined":
    case "expired":
      return "coral";
    case "converted":
      return "green";
    default:
      return "default";
  }
}

function formatPipelineValue(stats: B2BAdminStats): string {
  const entries = Object.entries(stats.pipelineByCurrency).filter(
    ([, v]) => typeof v === "number" && v > 0,
  ) as [B2BOfferCurrency, number][];
  if (entries.length === 0) return "—";
  return entries.map(([c, n]) => formatMoney(n, c)).join(" · ");
}

function autoCounterLabel(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t) || t <= Date.now()) return null;
  const ms = t - Date.now();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `Auto in ${h}h ${m}m`;
}

function isUrgent(row: AdminB2BOfferRow): boolean {
  if (row.status !== "pending") return false;
  const age = Date.now() - new Date(row.created_at).getTime();
  return age > 12 * 60 * 60 * 1000;
}

export default async function AdminB2BPage({ searchParams }: { searchParams: Promise<PageSearch> }) {
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

  if (!hasPermission(roles, "b2b", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const filters = parseFilters(sp);
  const [offers, stats] = await Promise.all([getAdminB2bOffers(filters), getB2bAdminStats()]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-semibold text-[#1a1a2e]">B2B Offers</h1>
        <p className="mt-1 font-sans text-sm text-[#888888]">
          Manage bulk pricing negotiations
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-4">
          <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
            Pending offers
          </p>
          <p className="mt-1 font-sans text-xl font-semibold text-[#1a1a2e]">{stats.pendingCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-4">
          <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
            Under review
          </p>
          <p className="mt-1 font-sans text-xl font-semibold text-[#1a1a2e]">{stats.reviewingCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-4">
          <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
            Pipeline value
          </p>
          <p className="mt-1 font-sans text-sm font-semibold leading-snug text-[#1a1a2e]">
            {formatPipelineValue(stats)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-4">
          <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
            Accepted this month
          </p>
          <p className="mt-1 font-sans text-xl font-semibold text-[#1a1a2e]">
            {stats.acceptedThisMonthCount}
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="mb-6 h-20 rounded-xl border border-[#E8E8E4] bg-white" />}>
        <B2BAdminFilters />
      </Suspense>

      <div className="overflow-x-auto rounded-xl border border-[#E8E8E4] bg-white">
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeadCell>Reference</Table.HeadCell>
              <Table.HeadCell>Buyer</Table.HeadCell>
              <Table.HeadCell>Product</Table.HeadCell>
              <Table.HeadCell align="right">Qty</Table.HeadCell>
              <Table.HeadCell align="right">Their offer</Table.HeadCell>
              <Table.HeadCell align="right">vs List</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Time</Table.HeadCell>
              <Table.HeadCell align="right">Action</Table.HeadCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {offers.map((row) => {
              const urgent = isUrgent(row);
              const autoL = autoCounterLabel(row.auto_counter_at);
              return (
                <Table.Row key={row.id} className={urgent ? "bg-[#FAEEDA]/60" : undefined}>
                  <Table.Cell>
                    <span className="flex items-center gap-1 font-mono text-[13px] font-medium text-[#1a1a2e]">
                      {urgent ? <span aria-hidden title="No response 12h+">⚠</span> : null}
                      {row.reference}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <p className="font-sans text-[13px] font-medium text-[#1a1a2e]">
                      {row.buyer_company?.trim() || "—"}
                    </p>
                    <p className="font-sans text-xs text-[#888]">{row.buyer_email}</p>
                  </Table.Cell>
                  <Table.Cell>
                    <p className="font-sans text-[13px] text-[#1a1a2e]">{row.product_name}</p>
                    <p className="font-sans text-xs text-[#888]">{row.product_code}</p>
                  </Table.Cell>
                  <Table.Cell align="right">{row.quantity}</Table.Cell>
                  <Table.Cell align="right" className="font-sans text-[13px] font-medium">
                    {formatMoney(Number(row.offered_price), row.currency)}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <p className="font-sans text-[13px]">{formatMoney(Number(row.list_price), row.currency)}</p>
                    <p className="font-sans text-xs text-[#888]">List</p>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={b2bStatusVariant(row.status)}>{row.status}</Badge>
                      {autoL ? (
                        <span className="font-sans text-[10px] text-[#888]">{autoL}</span>
                      ) : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="font-sans text-sm text-[#666]">
                    {formatTimeSince(row.created_at)}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Link
                      href={`/admin/b2b/${row.id}`}
                      className="font-sans text-[13px] font-medium text-[#185FA5] hover:underline"
                    >
                      Respond →
                    </Link>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </div>

      {offers.length === 0 ? (
        <p className="mt-8 text-center font-sans text-sm text-[#888]">No offers in this view.</p>
      ) : null}
    </div>
  );
}
