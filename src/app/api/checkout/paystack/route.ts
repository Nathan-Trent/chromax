import { NextResponse } from "next/server";

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

  if (body.currency !== "NGN") {
    return NextResponse.json(
      { error: "Currency must be NGN for Paystack checkout" },
      { status: 422 },
    );
  }

  // TODO: call Paystack initialize transaction API.
  // TODO: create order in Supabase with generateOrderReference().

  return NextResponse.json({
    data: {
      message: "Paystack coming soon",
      reference: "CX-TEST-0001",
    },
  });
}
