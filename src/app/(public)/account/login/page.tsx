"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RecaptchaLegalNote } from "@/components/public/RecaptchaLegalNote";
import { createClient } from "@/lib/supabase/client";
import { useRecaptcha } from "@/lib/recaptcha/useRecaptcha";
import { RECAPTCHA_USER_ERROR } from "@/lib/recaptcha/verify";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function AccountLoginForm() {
  const searchParams = useSearchParams();
  const { getToken } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const recaptchaToken = (await getToken("login")) ?? "";
    const check = await fetch("/api/auth/login-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recaptchaToken }),
    });
    if (!check.ok) {
      const j = (await check.json()) as { error?: string };
      setLoading(false);
      setError(typeof j.error === "string" ? j.error : RECAPTCHA_USER_ERROR);
      return;
    }
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signErr) {
      setError(signErr.message || "Could not sign in.");
      return;
    }
    const next = searchParams.get("next");
    const dest =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/account/orders";
    window.location.assign(dest);
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
          <h1 className="mt-4 text-center font-sans text-xl font-semibold text-[#1a1a2e]">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center font-sans text-sm text-[#555]">
            <Link href="/register" className="font-medium text-[#185FA5] hover:underline">
              Create account
            </Link>
            {" · "}
            <Link href="/account/forgot-password" className="font-medium text-[#185FA5] hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <div className="rounded-lg border border-[#A32D2D]/40 bg-[#A32D2D]/10 px-3 py-2 font-sans text-sm text-[#A32D2D]">
              {error}
            </div>
          ) : null}
          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            Sign in
          </Button>
          <RecaptchaLegalNote />
        </form>
      </div>
    </div>
  );
}

export default function AccountLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center font-sans text-sm text-[#555]">Loading…</div>
      }
    >
      <AccountLoginForm />
    </Suspense>
  );
}
