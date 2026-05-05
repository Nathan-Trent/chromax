"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { RecaptchaLegalNote } from "@/components/public/RecaptchaLegalNote";
import {
  formatCartPrice,
  getLineUnitPrice,
  useCartStore,
  type CartItem,
} from "@/lib/store/cart";
import { useRecaptcha } from "@/lib/recaptcha/useRecaptcha";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

const countryOptions = [
  { value: "NG", label: "Nigeria" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UA", label: "Ukraine" },
  { value: "OTHER", label: "Other" },
];

type FieldErrors = Partial<
  Record<
    | "fullName"
    | "email"
    | "line1"
    | "city"
    | "country"
    | "postcode",
    string
  >
>;

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function generateStubOrderReference(): string {
  const y = new Date().getFullYear();
  const rnd = String(Math.floor(1000 + Math.random() * 9000));
  return `CX-${y}-${rnd}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { getToken } = useRecaptcha();
  const items = useCartStore((s) => s.items);
  const currency = useCartStore((s) => s.currency);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postcode, setPostcode] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [displayRef, setDisplayRef] = useState("");

  useEffect(() => {
    if (items.length === 0 && !success) {
      router.replace("/cart");
    }
  }, [items.length, router, success]);

  const total = getTotal();
  const paymentProvider = currency === "NGN" ? "paystack" : "stripe";

  const formValid = useMemo(() => {
    return (
      fullName.trim() &&
      email.trim() &&
      emailOk(email) &&
      line1.trim() &&
      city.trim() &&
      country
    );
  }, [fullName, email, line1, city, country]);

  const checkoutStep = useMemo(() => {
    if (!fullName.trim() || !emailOk(email)) return 1;
    if (!line1.trim() || !city.trim() || !country) return 2;
    return 3;
  }, [fullName, email, line1, city, country]);

  function stepCardClass(step: number) {
    if (checkoutStep > step) return "border-l-4 border-l-[#0F6E56]";
    if (checkoutStep === step) return "border-l-4 border-l-[#E8A020]";
    return "border-l-4 border-l-transparent";
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "Required";
    if (!email.trim()) next.email = "Required";
    else if (!emailOk(email)) next.email = "Enter a valid email";
    if (!line1.trim()) next.line1 = "Required";
    if (!city.trim()) next.city = "Required";
    if (!country) next.country = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePlaceOrder(recaptchaToken: string) {
    if (!validate()) return;
    setLoading(true);

    const contact = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
    };
    const shippingAddress = {
      line1: line1.trim(),
      line2: line2.trim() || null,
      city: city.trim(),
      country,
      postcode: postcode.trim() || null,
    };

    const payload = {
      contact,
      shippingAddress,
      items: items.map((i: CartItem) => ({
        lineKey: i.lineKey,
        id: i.id,
        name: i.name,
        slug: i.slug,
        quantity: i.quantity,
        variant: i.variant ?? null,
        unitPrices: {
          ngn: i.price_ngn,
          usd: i.price_usd,
          gbp: i.price_gbp,
        },
      })),
      total,
      currency,
      paymentProvider,
      recaptchaToken,
    };

    console.log("[checkout] place order (stub)", payload);

    await new Promise((r) => setTimeout(r, 1500));

    setDisplayRef(generateStubOrderReference());

    clearCart();
    setSuccess(true);
    setLoading(false);

    // TODO: Replace stub handler with real API calls (include recaptchaToken in the request body):
    // NGN → POST /api/checkout/paystack
    // USD/GBP → POST /api/checkout/stripe
  }

  if (items.length === 0 && !success) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#F5F0E8] font-sans text-[#888]">
        Redirecting…
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] px-4 py-10 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-lg rounded-xl bg-white p-10 text-center shadow-sm">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1D9E75]/15 text-[#1D9E75]"
            aria-hidden
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="mt-4 font-sans text-2xl font-semibold text-[#1a1a2e]">
            Order received!
          </h1>
          <p className="mt-1 font-mono text-sm text-[#888888]">{displayRef}</p>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-[#555555]">
            {currency === "NGN"
              ? "Our team will send you a Paystack payment link shortly. Please check your email."
              : "Our team will contact you to arrange international payment. Please check your email."}
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--color-gold)] px-5 py-2.5 font-sans text-[13px] font-medium text-[var(--color-navy)] transition-colors hover:bg-[#D49215]"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <section className="bg-[#1a1a2e] py-8">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-white sm:text-4xl">
            Checkout
          </h1>
          <div
            className="mt-8 flex w-full max-w-xl items-center"
            aria-label="Checkout progress"
          >
            {([1, 2, 3] as const).map((n, idx) => (
              <Fragment key={n}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    aria-label={
                      n === 1
                        ? "Step 1 of 3 — Contact"
                        : n === 2
                          ? "Step 2 of 3 — Shipping"
                          : "Step 3 of 3 — Payment"
                    }
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 font-sans text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none ${
                      checkoutStep > n
                        ? "border-[#E8A020] bg-[#E8A020] text-[#1a1a2e]"
                        : checkoutStep === n
                          ? "border-white bg-transparent text-white"
                          : "border-white/25 text-white/25"
                    }`}
                  >
                    {n}
                  </div>
                  <span className="hidden font-sans text-xs uppercase tracking-wider text-white/50 sm:block sm:text-[10px]">
                    {n === 1 ? "Contact" : n === 2 ? "Shipping" : "Payment"}
                  </span>
                </div>
                {idx < 2 ? (
                  <div
                    className={`mx-2 h-0.5 min-w-[1.5rem] flex-1 rounded-full transition-colors duration-150 motion-reduce:transition-none ${
                      checkoutStep > n ? "bg-[#E8A020]" : "bg-white/20"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-12 lg:pt-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 lg:order-1">
            <div className={`mb-4 rounded-xl border border-[#E8E8E4] bg-white p-6 ${stepCardClass(1)}`}>
              <h2 className="mb-4 font-sans text-[13px] font-semibold text-[#1a1a2e]">
                1. Contact details
              </h2>
              <div className="flex flex-col gap-4">
                <Input
                  label="Full name"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={errors.fullName}
                  required
                />
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  required
                />
                <Input
                  label="Phone number"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  helper="Optional"
                />
              </div>
            </div>

            <div className={`mb-4 rounded-xl border border-[#E8E8E4] bg-white p-6 ${stepCardClass(2)}`}>
              <h2 className="mb-4 font-sans text-[13px] font-semibold text-[#1a1a2e]">
                2. Shipping address
              </h2>
              <div className="flex flex-col gap-4">
                <Input
                  label="Address line 1"
                  name="line1"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  error={errors.line1}
                  required
                />
                <Input
                  label="Address line 2"
                  name="line2"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  helper="Optional"
                />
                <Input
                  label="City"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  error={errors.city}
                  required
                />
                <Select
                  label="Country"
                  name="country"
                  placeholder="Select country"
                  options={countryOptions}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  error={errors.country}
                />
                <Input
                  label="Postcode / ZIP"
                  name="postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  helper="Optional"
                />
              </div>
              <div className="mt-3 rounded-lg bg-[#F5F0E8] p-3 font-sans text-xs text-[#555555]">
                {currency === "NGN"
                  ? "Local delivery by Chromax-MCR. Estimated delivery: 2–5 business days."
                  : "International shipping via freight forwarder. Shipping will be arranged after payment."}
              </div>
            </div>

            <div className={`mb-4 rounded-xl border border-[#E8E8E4] bg-white p-6 ${stepCardClass(3)}`}>
              <h2 className="mb-4 font-sans text-[13px] font-semibold text-[#1a1a2e]">
                3. Payment
              </h2>
              {currency === "NGN" ? (
                <div className="mb-3 inline-flex flex-col rounded border border-[#A3D9BE] bg-[#E8F8F0] px-3 py-1.5">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[#006B3C]">
                    Paying via Paystack
                  </span>
                  <span className="mt-1 text-xs text-[#555555]">
                    Accepts Nigerian bank cards, bank transfer and USSD
                  </span>
                </div>
              ) : (
                <div className="mb-3 inline-flex flex-col rounded border border-[#C4C2F0] bg-[#F0F0FF] px-3 py-1.5">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[#4B47CC]">
                    Paying via Stripe
                  </span>
                  <span className="mt-1 text-xs text-[#555555]">
                    Accepts international credit and debit cards
                  </span>
                </div>
              )}
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="btn-shine-gold mt-2 w-full py-3 text-[15px] font-semibold"
                disabled={!formValid}
                loading={loading}
                onClick={() => {
                  void (async () => {
                    const recaptchaToken = (await getToken("checkout")) ?? "";
                    await handlePlaceOrder(recaptchaToken);
                  })();
                }}
              >
                {`Place order — ${formatCartPrice(total, currency)}`}
              </Button>
              <RecaptchaLegalNote />
            </div>
          </div>

          <div className="lg:col-span-5 lg:order-2">
            <div className="relative top-0 overflow-hidden rounded-xl border border-[#E8E8E4] border-t-4 border-t-[#E8A020] bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="mb-4 font-sans text-[15px] font-semibold text-[#1a1a2e]">
                Order summary
              </h2>
              {items.map((item) => {
                const unit = getLineUnitPrice(item, currency);
                const sub = unit * item.quantity;
                return (
                  <div
                    key={item.lineKey}
                    className="mb-2 flex justify-between text-[13px] text-[#555555]"
                  >
                    <span className="min-w-0 flex-1 truncate pr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatCartPrice(sub, currency)}
                    </span>
                  </div>
                );
              })}
              <div className="my-4 border-t border-[#E8E8E4]" />
              <div className="flex justify-between font-semibold text-[#1a1a2e]">
                <span>Total</span>
                <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tabular-nums">
                  {formatCartPrice(total, currency)}
                </span>
              </div>
              <p className="mt-1 font-sans text-[11px] text-[#888888]">
                Prices shown in {currency}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-[#E8E8E4] pt-4 font-sans text-xs text-[#888888]">
                <span aria-hidden>🔒</span>
                <span>Your order is processed securely</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
