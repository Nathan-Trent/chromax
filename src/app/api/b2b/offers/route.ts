import { sendB2BOfferReceived } from "@/lib/email";
import { notifySuperAdmins } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications/rules";
import { publicB2bOfferSchema } from "@/lib/schemas/b2b-public";
import { RECAPTCHA_USER_ERROR, verifyRecaptcha } from "@/lib/recaptcha/verify";
import { getSettingString } from "@/lib/settings/strings";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

function refForYear(y: number): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `B2B-${y}-${r}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = publicB2bOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const recaptchaToken = parsed.data.recaptchaToken ?? "";
  const recaptcha = await verifyRecaptcha(recaptchaToken, "b2b_offer", 0.5);
  if (!recaptcha.success) {
    return NextResponse.json({ error: RECAPTCHA_USER_ERROR }, { status: 400 });
  }

  const { recaptchaToken: _rt, ...d } = parsed.data;
  void _rt;
  const y = new Date().getFullYear();
  let reference = refForYear(y);

  try {
    const service = createServiceRoleClient();

    const { data: product, error: pErr } = await service
      .from("products")
      .select("id, name, slug, status, price_ngn, price_usd, price_gbp, min_b2b_price_ngn, min_b2b_price_usd, min_b2b_price_gbp")
      .eq("id", d.product_id)
      .maybeSingle();

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }
    if (!product || product.status !== "live") {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }

    const listKey =
      d.currency === "NGN" ? "price_ngn" : d.currency === "USD" ? "price_usd" : "price_gbp";
    const minKey =
      d.currency === "NGN"
        ? "min_b2b_price_ngn"
        : d.currency === "USD"
          ? "min_b2b_price_usd"
          : "min_b2b_price_gbp";

    const listPrice = Number(product[listKey as keyof typeof product] ?? 0) || 0;
    const minPriceRaw = product[minKey as keyof typeof product];
    const minPrice =
      minPriceRaw !== null && minPriceRaw !== undefined && Number(minPriceRaw) > 0
        ? Number(minPriceRaw)
        : null;

    const productName = String(product.name);
    const productCode = String(product.slug ?? "").slice(0, 120) || productName;

    for (let attempt = 0; attempt < 5; attempt++) {
      reference = refForYear(y);
      const thread = d.message?.trim()
        ? [
            {
              from: "buyer",
              price: d.offered_price,
              message: d.message,
              timestamp: new Date().toISOString(),
            },
          ]
        : [];

      const { data: row, error: insErr } = await service
        .from("b2b_offers")
        .insert({
          reference,
          buyer_email: d.buyer_email.trim(),
          buyer_name: d.buyer_name.trim(),
          buyer_company: d.buyer_company?.trim() || null,
          buyer_country: d.buyer_country?.trim() || null,
          buyer_phone: d.buyer_phone?.trim() || null,
          product_id: d.product_id,
          product_name: productName,
          product_code: productCode,
          quantity: d.quantity,
          offered_price: d.offered_price,
          currency: d.currency,
          list_price: listPrice,
          min_price: minPrice,
          status: "pending",
          thread,
        })
        .select("id, reference, buyer_name, buyer_company, buyer_email, product_name, quantity, offered_price, currency")
        .maybeSingle();

      if (!insErr && row) {
        const adminEmail = await getSettingString("contact_email");
        const offer = {
          id: row.id,
          reference: row.reference,
          buyer_name: row.buyer_name,
          buyer_company: row.buyer_company,
          product_name: row.product_name,
          quantity: row.quantity,
          offered_price: Number(row.offered_price),
          currency: row.currency,
        };

        void notifySuperAdmins({
          type: NOTIFICATION_TYPES.B2B_OFFER_NEW,
          title: "New B2B offer",
          message: `${offer.buyer_company ?? offer.buyer_name} offered ${offer.offered_price} ${offer.currency} for ${offer.quantity}× ${offer.product_name}`,
        });

        if (adminEmail) {
          void sendB2BOfferReceived(offer, adminEmail);
        }

        return NextResponse.json({
          data: { reference: row.reference, id: row.id },
        });
      }

      if (insErr?.code !== "23505") {
        return NextResponse.json({ error: insErr?.message ?? "Insert failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Could not allocate reference" }, { status: 500 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
