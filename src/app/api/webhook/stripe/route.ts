import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("stripe-signature");

  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret || !signature) {
    return NextResponse.json(
      { error: "Missing webhook secret or signature" },
      { status: 400 },
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const stripe = new Stripe(stripeSecretKey || "sk_test_stub", {
    typescript: true,
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.warn("[webhook/stripe] signature verification failed", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[webhook/stripe] event type", event.type);

  // TODO: handle payment_intent.succeeded —
  //   update order payment_status to 'paid',
  //   update status to 'confirmed',
  //   send confirmation email,
  //   fire ERP sync event order.created

  return NextResponse.json({ received: true });
}
