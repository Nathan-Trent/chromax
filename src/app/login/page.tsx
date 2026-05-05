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

function LoginForm() {
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
    const recaptchaToken = (await getToken("admin_login")) ?? "";
    const check = await fetch("/api/auth/admin-login-check", {
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
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message || "Could not sign in. Check your details and try again.");
      return;
    }
    const next = searchParams.get("next");
    const dest =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin/dashboard";
    // Full navigation so Set-Cookie from sign-in is always sent on the next request.
    // Client router transitions can run before middleware sees the new session cookies.
    window.location.assign(dest);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a2e] px-4 py-8">
      <div className="mx-auto mt-[15vh] w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <Link href="/" className="block">
            <div className="mx-auto h-14 w-14">
              <Image
                src="/images/chromax-logo.png"
                alt="Chromax-MCR"
                width={56}
                height={56}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </Link>
          <h2 className="mt-4 text-center font-sans text-xl font-semibold text-[#1a1a2e]">
            Admin login
          </h2>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <div
              className="rounded-lg border border-[#A32D2D]/40 bg-[#A32D2D]/10 px-3 py-2 font-sans text-sm text-[#A32D2D]"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          <Button type="submit" className="mt-2 w-full" loading={loading} disabled={loading}>
            Sign in
          </Button>
          <RecaptchaLegalNote />
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e] font-sans text-sm text-white/70">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
