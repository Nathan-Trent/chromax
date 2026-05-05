import { NextResponse } from "next/server";
import { getPaymentConfig } from "@/lib/payments/config";

type CheckoutBody = {
  items?: unknown;
  contact?: unknown;
  shippingAddress?: unknown;
  total?: number;
  currency?: string;
};

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (body.currency !== "USD" && body.currency !== "GBP") {
    return NextResponse.json(
      { error: "Currency must be USD or GBP for Stripe checkout" },
      { status: 422 },
    );
  }

  const config = await getPaymentConfig();
  console.log("[checkout/stripe] config (public keys only logged in dev)", {
    stripeEnabled: config.stripe.enabled,
    publishableKeyPrefix: config.stripe.publishableKey?.slice(0, 8),
  });

  // TODO: create Stripe payment intent.
  // TODO: create order in Supabase with generateOrderReference().

  return NextResponse.json({
    data: {
      message: "Stripe coming soon",
      reference: "CX-TEST-0001",
    },
  });
}
