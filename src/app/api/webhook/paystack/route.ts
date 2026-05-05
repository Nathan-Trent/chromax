import { createHmac, timingSafeEqual } from "crypto";
import { sendOrderConfirmation } from "@/lib/email";
import { notifySuperAdmins } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications/rules";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

type PaystackEvent = {
  event?: string;
  data?: {
    reference?: string;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(request: Request) {
  const raw = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature =
    request.headers.get("x-paystack-signature") ??
    request.headers.get("X-Paystack-Signature") ??
    "";

  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? "";
  const hash = createHmac("sha256", secret).update(raw).digest("hex");

  if (!secret || !safeEqual(hash, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const evt = body as PaystackEvent;

  if (evt.event === "charge.success" && evt.data) {
    const meta = (evt.data.metadata ?? {}) as Record<string, unknown>;
    const orderRefRaw = meta.order_reference ?? meta.orderReference;
    const orderRef = typeof orderRefRaw === "string" ? orderRefRaw.trim() : "";

    if (orderRef) {
      try {
        const service = createServiceRoleClient();
        const { data: order } = await service
          .from("orders")
          .select("*")
          .eq("reference", orderRef)
          .maybeSingle();

        if (order && order.payment_status !== "paid") {
          const paymentRef = typeof evt.data.reference === "string" ? evt.data.reference : null;
          await service
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed",
              payment_method: "paystack",
              payment_ref: paymentRef,
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
        }
      } catch (e) {
        console.warn("[webhook/paystack] charge.success handler:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
