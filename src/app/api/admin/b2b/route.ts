import { getAdminRequestContext } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import { adminB2bListQuerySchema } from "@/lib/schemas/admin-b2b";
import { getAdminB2bOffers } from "@/lib/supabase/queries/b2b-admin";
import type { B2BOfferCurrency, B2BOfferStatus } from "@/types/b2b-offer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "b2b", "view")) {
    return NextResponse.json({ error: "You don't have permission" }, { status: 403 });
  }

  const url = new URL(request.url);
  const raw = {
    status: url.searchParams.get("status") ?? undefined,
    currency: url.searchParams.get("currency") ?? undefined,
  };
  const parsed = adminB2bListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const q = parsed.data;
  const status =
    q.status === "pending" ||
    q.status === "reviewing" ||
    q.status === "countered" ||
    q.status === "accepted" ||
    q.status === "declined" ||
    q.status === "expired" ||
    q.status === "converted"
      ? (q.status as B2BOfferStatus)
      : "all";
  const currency =
    q.currency === "NGN" || q.currency === "USD" || q.currency === "GBP"
      ? (q.currency as B2BOfferCurrency)
      : "all";

  const offers = await getAdminB2bOffers({ status, currency });

  return NextResponse.json({ data: { offers } });
}
