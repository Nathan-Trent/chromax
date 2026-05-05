import { B2BInternalNotes } from "@/components/admin/b2b/B2BInternalNotes";
import { B2BOfferRespondPanel } from "@/components/admin/b2b/B2BOfferRespondPanel";
import { Badge } from "@/components/ui/Badge";
import { hasPermission } from "@/lib/auth/permissions";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { getAdminB2bOfferById } from "@/lib/supabase/queries/b2b-admin";
import { createClient } from "@/lib/supabase/server";
import type { B2BThreadEntry } from "@/types/b2b-offer";
import type { Role } from "@/types/role";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

const RESPOND_STATUSES = ["pending", "reviewing", "countered"] as const;

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

function threadTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminB2BDetailPage({ params }: Props) {
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

  if (!hasPermission(roles, "b2b", "view")) {
    return (
      <div className="p-8">
        <p className="font-sans text-[#888]">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  const offer = await getAdminB2bOfferById(id);
  if (!offer) {
    notFound();
  }

  const canRespond = hasPermission(roles, "b2b", "respond");
  const showRespond =
    canRespond &&
    (RESPOND_STATUSES as readonly string[]).includes(offer.status);

  const min = offer.min_price != null ? Number(offer.min_price) : null;
  const offered = Number(offer.offered_price);
  const list = Number(offer.list_price);
  const vsMin =
    min != null && Number.isFinite(min)
      ? offered >= min
      : true;
  const discountPct =
    list > 0 && Number.isFinite(list) ? Math.round(((list - offered) / list) * 100) : 0;

  const thread: B2BThreadEntry[] = Array.isArray(offer.thread) ? offer.thread : [];
  const sortedThread = [...thread].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/admin/b2b"
        className="mb-6 inline-block font-sans text-sm font-medium text-[#185FA5] hover:underline"
      >
        ← B2B Offers
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <section className="mb-4 rounded-xl bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="font-mono text-xl font-semibold text-[#1a1a2e] md:text-2xl">
                {offer.reference}
              </p>
              <Badge variant={b2bStatusVariant(offer.status)}>{offer.status}</Badge>
            </div>
            <p className="mt-4 font-sans text-sm text-[#555]">
              Submitted {formatLongDate(offer.created_at)}
            </p>
            <p className="mt-2 font-sans text-sm text-[#555]">
              Auto-counter:{" "}
              {offer.auto_counter_at ? formatLongDate(offer.auto_counter_at) : "Not configured"}
            </p>
          </section>

          <section className="mb-4 rounded-xl bg-white p-6">
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Buyer
            </p>
            <p className="font-sans text-[15px] font-medium text-[#1a1a2e]">
              {offer.buyer_company?.trim() || "—"}
            </p>
            <p className="mt-2 font-sans text-sm text-[#555]">{offer.buyer_name}</p>
            <a
              href={`mailto:${offer.buyer_email}`}
              className="mt-1 block font-sans text-sm text-[#185FA5] hover:underline"
            >
              {offer.buyer_email}
            </a>
            {offer.buyer_phone ? (
              <p className="mt-2 font-sans text-sm text-[#555]">{offer.buyer_phone}</p>
            ) : null}
            <p className="mt-2 font-sans text-sm text-[#555]">
              {offer.buyer_country ?? "—"}
            </p>
          </section>

          <section className="mb-4 rounded-xl bg-white p-6">
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Product and pricing
            </p>
            <p className="font-sans text-[15px] font-medium text-[#1a1a2e]">{offer.product_name}</p>
            <p className="font-sans text-sm text-[#888]">{offer.product_code}</p>
            <p className="mt-4 font-sans text-sm text-[#555]">
              Quantity requested:{" "}
              <span className="font-semibold text-[#1a1a2e]">{offer.quantity}</span>
            </p>
            <p
              className={[
                "mt-3 font-sans text-2xl font-semibold",
                vsMin ? "text-[#0F6E56]" : "text-[#A32D2D]",
              ].join(" ")}
            >
              Their offer: {formatMoney(offered, offer.currency)}
            </p>
            <p className="mt-2 font-sans text-sm text-[#555]">
              List price: {formatMoney(list, offer.currency)}
            </p>
            {canRespond && min != null ? (
              <p className="mt-2 font-sans text-xs text-[#888]">
                Internal floor price — not visible to buyer:{" "}
                <span className="font-medium text-[#1a1a2e]">{formatMoney(min, offer.currency)}</span>
              </p>
            ) : null}
            <p className="mt-2 font-sans text-sm text-[#555]">
              Discount from list:{" "}
              <span className="font-medium">{discountPct}%</span>
            </p>
          </section>

          <section className="mb-4 rounded-xl bg-white p-6">
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
              Negotiation thread
            </p>
            <div className="flex flex-col gap-3">
              {sortedThread.length === 0 ? (
                <p className="font-sans text-sm text-[#888]">No messages yet.</p>
              ) : (
                sortedThread.map((m, idx) => {
                  const fromBuyer = m.from === "buyer";
                  return (
                    <div
                      key={`${m.timestamp}-${idx}`}
                      className={[
                        "flex w-full",
                        fromBuyer ? "justify-start" : "justify-end",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "max-w-[80%] rounded-xl p-3",
                          fromBuyer ? "bg-[#F5F0E8]" : "bg-[#E6F1FB]",
                        ].join(" ")}
                      >
                        <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
                          {fromBuyer ? "Buyer" : "Chromax"}
                          {m.by ? ` · ${m.by}` : ""}
                        </p>
                        {m.price != null ? (
                          <p className="mt-1 font-sans text-sm font-semibold text-[#1a1a2e]">
                            {formatMoney(Number(m.price), offer.currency)}
                          </p>
                        ) : null}
                        <p className="mt-1 font-sans text-sm text-[#555]">{m.message}</p>
                        <p className="mt-2 font-sans text-[11px] text-[#888]">{threadTime(m.timestamp)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            {showRespond ? (
              <section className="rounded-xl bg-white p-6">
                <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                  Respond to offer
                </p>
                <B2BOfferRespondPanel
                  offerId={offer.id}
                  offeredPrice={offered}
                  currency={offer.currency}
                  minPrice={min}
                />
              </section>
            ) : null}

            <B2BInternalNotes
              offerId={offer.id}
              initialNotes={offer.internal_notes}
              canEdit={hasPermission(roles, "b2b", "view")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
