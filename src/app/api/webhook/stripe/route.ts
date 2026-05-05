import Stripe from "stripe";
import { sendOrderConfirmation } from "@/lib/email";
import { notifySuperAdmins } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications/rules";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizedOrderReference(meta: Stripe.Metadata | null): string {
  if (!meta) return "";
  const raw = meta.order_reference ?? meta.reference;
  return typeof raw === "string" ? raw.trim() : "";
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const stripe = new Stripe(stripeSecretKey || "sk_test_stub", {
    typescript: true,
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature ?? "", secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.warn("[webhook/stripe] signature verification failed", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const service = createServiceRoleClient();

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderRef = normalizedOrderReference(pi.metadata ?? null);
      if (!orderRef) {
        console.warn("[webhook/stripe] payment_intent.succeeded missing order reference metadata");
      } else {
        const { data: order } = await service
          .from("orders")
          .select("*")
          .eq("reference", orderRef)
          .maybeSingle();

        if (order && order.payment_status !== "paid") {
          await service
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed",
              payment_method: "stripe",
              payment_ref: pi.id,
            })
            .eq("id", order.id);

          const shipping =
            typeof order.shipping_address === "object" && order.shipping_address !== null
              ? JSON.stringify(order.shipping_address, null, 2)
              : String(order.shipping_address ?? "");

          void sendOrderConfirmation({
            reference: order.reference,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            items: order.items as unknown[],
            total: Number(order.total),
            currency: order.currency,
            shipping_address: shipping,
          });

          void notifySuperAdmins({
            type: NOTIFICATION_TYPES.ORDER_NEW,
            title: "New order received",
            message: `Order ${order.reference} from ${order.customer_name} — ${order.total} ${order.currency}`,
          });

          await service.from("audit_log").insert({
            user_id: null,
            user_email: "stripe@webhook",
            user_role: "Stripe",
            action_type: "order.payment_confirmed",
            section: "orders",
            record_id: order.id,
            record_label: order.reference,
            before_values: { payment_status: order.payment_status, status: order.status },
            after_values: { payment_status: "paid", status: "confirmed", payment_ref: pi.id },
            source: "stripe",
          });
        }
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      let orderRef = normalizedOrderReference(charge.metadata ?? null);
      if (!orderRef) {
        const pi = charge.payment_intent;
        const piId = typeof pi === "string" ? pi : pi?.id;
        if (piId) {
          const { data: byPi } = await service
            .from("orders")
            .select("reference, id, payment_status")
            .eq("payment_ref", piId)
            .maybeSingle();
          if (byPi?.reference) {
            orderRef = String(byPi.reference);
          }
        }
      }

      if (!orderRef) {
        console.warn("[webhook/stripe] charge.refunded could not resolve order");
      } else {
        const { data: order } = await service
          .from("orders")
          .select("*")
          .eq("reference", orderRef)
          .maybeSingle();

        if (order && order.payment_status !== "refunded") {
          await service
            .from("orders")
            .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
            .eq("id", order.id);

          await service.from("audit_log").insert({
            user_id: null,
            user_email: "stripe@webhook",
            user_role: "Stripe",
            action_type: "order.refunded",
            section: "orders",
            record_id: order.id,
            record_label: order.reference,
            before_values: { payment_status: order.payment_status },
            after_values: { payment_status: "refunded" },
            source: "stripe",
          });
        }
      }
    }
  } catch (e) {
    console.warn("[webhook/stripe] handler error:", e);
  }

  return NextResponse.json({ received: true });
}
