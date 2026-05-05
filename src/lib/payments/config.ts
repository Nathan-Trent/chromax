import { getSettings } from "@/lib/supabase/queries/settings";

export interface PaymentConfig {
  paystack: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  stripe: {
    enabled: boolean;
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  supportedCurrencies: ("NGN" | "USD" | "GBP")[];
}

function asBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === true) return true;
  if (v === "false" || v === false) return false;
  return fallback;
}

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function asCurrencyArray(v: unknown): ("NGN" | "USD" | "GBP")[] {
  if (!Array.isArray(v)) return ["NGN", "USD", "GBP"];
  const allowed = new Set<string>(["NGN", "USD", "GBP"]);
  return v.filter((x): x is "NGN" | "USD" | "GBP" =>
    typeof x === "string" && allowed.has(x),
  );
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  let rows: Record<string, unknown> = {};
  try {
    rows = await getSettings();
  } catch (e) {
    console.warn("getPaymentConfig: getSettings failed", e);
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const paystackWebhook = process.env.PAYSTACK_WEBHOOK_SECRET ?? "";
  const stripeSecret = process.env.STRIPE_SECRET_KEY ?? "";
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!paystackSecret) {
    console.warn("getPaymentConfig: PAYSTACK_SECRET_KEY is missing");
  }
  if (!stripeSecret) {
    console.warn("getPaymentConfig: STRIPE_SECRET_KEY is missing");
  }

  const paystackPkDb = asString(rows.paystack_public_key);
  const stripePkDb = asString(rows.stripe_publishable_key);

  return {
    paystack: {
      enabled: asBool(rows.paystack_enabled, true),
      publicKey: paystackPkDb || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
      secretKey: paystackSecret,
      webhookSecret: paystackWebhook,
    },
    stripe: {
      enabled: asBool(rows.stripe_enabled, true),
      publishableKey:
        stripePkDb || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY || "",
      secretKey: stripeSecret,
      webhookSecret: stripeWebhook,
    },
    supportedCurrencies: asCurrencyArray(rows.supported_currencies),
  };
}
