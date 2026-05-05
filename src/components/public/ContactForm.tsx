"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { RecaptchaLegalNote } from "@/components/public/RecaptchaLegalNote";
import { useRecaptcha } from "@/lib/recaptcha/useRecaptcha";
import { RECAPTCHA_USER_ERROR } from "@/lib/recaptcha/verify";
import { useCartStore } from "@/lib/store/cart";
import type { FormEvent } from "react";
import { Suspense, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const countryOptions = [
  { value: "NG", label: "Nigeria" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UA", label: "Ukraine" },
  { value: "OTHER", label: "Other" },
];

const currencyOptions = [
  { value: "NGN", label: "NGN" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
];

const messageTypeOptions = [
  { value: "general", label: "General enquiry" },
  { value: "quote", label: "Request a quote" },
  { value: "b2b", label: "Bulk / B2B order" },
  { value: "technical", label: "Technical question" },
  { value: "custom", label: "Custom formulation" },
];

const initialErrors: Record<string, string | undefined> = {
  name: undefined,
  email: undefined,
  country: undefined,
  messageType: undefined,
  message: undefined,
  b2bQuantity: undefined,
  b2bOfferedPrice: undefined,
};

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
}

function ContactFormInner() {
  const formId = useId();
  const searchParams = useSearchParams();
  const { getToken } = useRecaptcha();
  const navCurrency = useCartStore((s) => s.currency);

  const b2bProductId = useMemo(() => {
    const type = searchParams.get("type");
    const pid = searchParams.get("product_id");
    if (type === "b2b" && pid && isUuid(pid)) return pid;
    return null;
  }, [searchParams]);

  const productSlugHint = useMemo(() => {
    if (!b2bProductId) return null;
    return searchParams.get("product_slug");
  }, [searchParams, b2bProductId]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [messageTypeChoice, setMessageTypeChoice] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState(initialErrors);
  const [submitted, setSubmitted] = useState(false);
  const [b2bQuantity, setB2bQuantity] = useState("");
  const [b2bOfferedPrice, setB2bOfferedPrice] = useState("");
  const [b2bOfferCurrencyOverride, setB2bOfferCurrencyOverride] = useState<"NGN" | "USD" | "GBP" | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const messageType = messageTypeChoice || (b2bProductId ? "b2b" : "");
  const offerCurrency = b2bOfferCurrencyOverride ?? navCurrency;

  const resetForm = () => {
    setName("");
    setEmail("");
    setCompany("");
    setCountry("");
    setMessageTypeChoice("");
    setMessage("");
    setErrors(initialErrors);
    setSubmitted(false);
    setB2bQuantity("");
    setB2bOfferedPrice("");
    setB2bOfferCurrencyOverride(null);
    setSubmitError(null);
  };

  const validate = (): boolean => {
    const next: typeof errors = { ...initialErrors };
    if (!name.trim()) next.name = "Please enter your name";
    if (!email.trim()) {
      next.email = "Please enter your email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please enter a valid email address";
    }
    if (!country) next.country = "Please select a country";
    if (!messageType) next.messageType = "Please select a message type";
    if (!message.trim()) {
      next.message = "Please enter a message";
    } else if (message.trim().length < 20) {
      next.message = "Message must be at least 20 characters";
    }

    const isB2bOffer =
      Boolean(b2bProductId) && messageType === "b2b";

    if (isB2bOffer) {
      const q = Number.parseInt(b2bQuantity, 10);
      if (!Number.isFinite(q) || q < 1) {
        next.b2bQuantity = "Enter a quantity of at least 1";
      }
      const price = Number.parseFloat(b2bOfferedPrice);
      if (!Number.isFinite(price) || price <= 0) {
        next.b2bOfferedPrice = "Enter a valid offered unit price";
      }
    }

    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const isB2bOffer = Boolean(b2bProductId) && messageType === "b2b";

    setSubmitting(true);
    try {
      if (isB2bOffer && b2bProductId) {
        const token = (await getToken("b2b_offer")) ?? "";
        const quantity = Number.parseInt(b2bQuantity, 10);
        const offeredPrice = Number.parseFloat(b2bOfferedPrice);
        const res = await fetch("/api/b2b/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyer_email: email.trim(),
            buyer_name: name.trim(),
            buyer_company: company.trim() || null,
            buyer_country: country || null,
            buyer_phone: null,
            product_id: b2bProductId,
            quantity,
            offered_price: offeredPrice,
            currency: offerCurrency,
            message: message.trim() || null,
            recaptchaToken: token,
          }),
        });
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setSubmitError(
            typeof j.error === "string" && j.error.length > 0
              ? j.error
              : RECAPTCHA_USER_ERROR,
          );
          return;
        }
        setSubmitted(true);
        return;
      }

      const token = (await getToken("contact_form")) ?? "";
      // TODO: when wiring to API, verify the recaptchaToken server-side in the route handler using verifyRecaptcha('contact_form')
      console.log({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || null,
        country,
        messageType,
        message: message.trim(),
        recaptchaToken: token,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const baseTextarea =
    "min-h-[120px] w-full resize-y rounded-lg border px-3.5 py-2.5 font-sans text-sm text-[#333333] placeholder:text-[#999999] transition-[box-shadow,border-color] duration-200 ease-in-out motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]";

  const textareaBorderNormal = "border-[#D0D0CA]";
  const textareaBorderError =
    "border-[#A32D2D] focus:border-[#A32D2D] focus:ring-[#A32D2D]";

  const messageFieldId = `${formId}-message`;

  if (submitted) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#E8E8E4] border-t-4 border-t-[#E8A020] bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <span
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1D9E75]/15 text-[#1D9E75]"
            aria-hidden
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#1D9E75]"
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
          <p className="text-lg font-semibold text-[#1a1a2e]">Message sent!</p>
          <p className="mt-2 text-[15px] text-[#555555]">
            We&apos;ll get back to you within 1 business day.
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="mt-6 font-sans text-sm font-medium text-[#185FA5] underline-offset-2 hover:underline"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E8E4] border-t-4 border-t-[#E8A020] bg-white p-8 shadow-lg">
      {b2bProductId && productSlugHint ? (
        <p className="mb-5 rounded-lg bg-[#F5F0E8] p-3 font-sans text-sm text-[#555555]">
          Bulk offer for product{" "}
          <span className="font-semibold text-[#1a1a2e]">{productSlugHint}</span>
          . Fill in your target quantity and price below.
        </p>
      ) : null}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Company"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          helper="Optional"
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
        <Select
          label="Message type"
          name="messageType"
          placeholder="Select type"
          options={messageTypeOptions}
          value={messageType}
          onChange={(e) => setMessageTypeChoice(e.target.value)}
          error={errors.messageType}
        />
        {b2bProductId && messageType === "b2b" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Quantity"
              name="b2bQuantity"
              type="number"
              value={b2bQuantity}
              onChange={(e) => setB2bQuantity(e.target.value)}
              error={errors.b2bQuantity}
              required
            />
            <Input
              label="Offered unit price"
              name="b2bOfferedPrice"
              type="number"
              value={b2bOfferedPrice}
              onChange={(e) => setB2bOfferedPrice(e.target.value)}
              error={errors.b2bOfferedPrice}
              required
            />
            <Select
              label="Currency"
              name="b2bCurrency"
              placeholder="Currency"
              options={currencyOptions}
              value={offerCurrency}
              onChange={(e) =>
                setB2bOfferCurrencyOverride(e.target.value as "NGN" | "USD" | "GBP")
              }
            />
          </div>
        ) : null}
        <div className="w-full">
          <label
            htmlFor={messageFieldId}
            className="mb-1.5 block font-sans text-[13px] font-medium text-[#333333]"
          >
            Message
          </label>
          <textarea
            id={messageFieldId}
            name="message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={
              errors.message ? `${messageFieldId}-error` : undefined
            }
            className={`${baseTextarea} ${errors.message ? textareaBorderError : textareaBorderNormal}`}
            placeholder="How can we help?"
          />
          {errors.message ? (
            <p
              id={`${messageFieldId}-error`}
              className="mt-1 font-sans text-xs text-[#A32D2D]"
            >
              {errors.message}
            </p>
          ) : null}
        </div>
        {submitError ? (
          <div className="rounded-lg border border-[#A32D2D]/40 bg-[#A32D2D]/10 px-3 py-2 font-sans text-sm text-[#A32D2D]">
            {submitError}
          </div>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={submitting}
          disabled={submitting}
        >
          Send message
        </Button>
        <RecaptchaLegalNote />
      </form>
    </div>
  );
}

export function ContactForm() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-[#E8E8E4] bg-white p-8 font-sans text-sm text-[#888] shadow-lg">
          Loading form…
        </div>
      }
    >
      <ContactFormInner />
    </Suspense>
  );
}
