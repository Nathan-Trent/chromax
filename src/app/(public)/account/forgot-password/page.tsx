"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RecaptchaLegalNote } from "@/components/public/RecaptchaLegalNote";
import { useRecaptcha } from "@/lib/recaptcha/useRecaptcha";
import { RECAPTCHA_USER_ERROR } from "@/lib/recaptcha/verify";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const { getToken } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const recaptchaToken = (await getToken("forgot_password")) ?? "";
    const res = await fetch("/api/auth/forgot-password-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), recaptchaToken }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(typeof j.error === "string" ? j.error : RECAPTCHA_USER_ERROR);
      return;
    }
    setSent(true);
  }

  return (
    <div className="relative -mt-16 min-h-[calc(100vh-4rem)] bg-[#1a1a2e] px-4 pb-16 pt-[calc(4rem+10vh)]">
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14">
            <Image
              src="/images/chromax-logo.png"
              alt="Chromax-MCR"
              width={56}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="mt-4 text-center font-sans text-xl font-semibold text-[#1a1a2e]">Forgot password</h1>
        </div>
        {!sent ? (
          <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error ? (
              <div className="rounded-lg border border-[#A32D2D]/40 bg-[#A32D2D]/10 px-3 py-2 font-sans text-sm text-[#A32D2D]">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              Send reset link
            </Button>
            <RecaptchaLegalNote />
          </form>
        ) : (
          <p className="mt-6 text-center font-sans text-sm text-[#555]">
            If that email exists in our system, you&apos;ll receive a password reset link shortly.
          </p>
        )}
        <p className="mt-6 text-center">
          <Link href="/account/login" className="font-sans text-sm font-medium text-[#185FA5] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
