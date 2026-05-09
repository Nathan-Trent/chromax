"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RecaptchaLegalNote } from "@/components/public/RecaptchaLegalNote";
import { createClient } from "@/lib/supabase/client";
import { useRecaptcha } from "@/lib/recaptcha/useRecaptcha";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function strengthLabel(pw: string): { label: string; widthPct: number; color: string } {
  if (pw.length < 8) return { label: "Weak", widthPct: 33, color: "#A32D2D" };
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  if (pw.length >= 8 && hasLower && hasUpper && hasNum) {
    return { label: "Strong", widthPct: 100, color: "#1D9E75" };
  }
  if (pw.length >= 8) return { label: "Fair", widthPct: 66, color: "#BA7517" };
  return { label: "Weak", widthPct: 33, color: "#A32D2D" };
}

export default function RegisterPage() {
  const { getToken } = useRecaptcha();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const s = strengthLabel(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const recaptchaToken = (await getToken("register")) ?? "";
    const supabase = createClient();
    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (signErr) {
      setLoading(false);
      setError(signErr.message);
      return;
    }
    const user = data.user;
    if (!user?.id) {
      setLoading(false);
      setError("Could not create account.");
      return;
    }
    const reg = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        fullName: name.trim(),
        email: email.trim(),
        marketingConsent: marketing,
        recaptchaToken,
      }),
    });
    if (!reg.ok) {
      const j = (await reg.json()) as { error?: string };
      if (reg.status === 400 && typeof j.error === "string") {
        setError(j.error);
      } else {
        setError(j.error ?? "Could not complete registration.");
      }
      setLoading(false);
      return;
    }
    setLoading(false);
    setDone(true);
  }

  return (
    <div className="relative -mt-16 min-h-[calc(100vh-4rem)] bg-[#1a1a2e] px-4 pb-16 pt-[calc(4rem+10vh)] sm:px-6 lg:px-8">
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
          {!done ? (
            <>
              <h1 className="mt-4 text-center font-sans text-xl font-semibold text-[#1a1a2e]">Create account</h1>
              <p className="mt-2 font-sans text-sm text-[#555]">
                Already have an account?{" "}
                <Link href="/account/login" className="font-medium text-[#185FA5] hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : null}
        </div>

        {!done ? (
          <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[#E8E8E4]">
                <div
                  className="h-full transition-all duration-150 ease-out"
                  style={{ width: `${s.widthPct}%`, backgroundColor: s.color }}
                />
              </div>
              <p className="mt-1 font-sans text-[11px] text-[#888]">
                Strength: <span style={{ color: s.color }}>{s.label}</span>
              </p>
            </div>
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <label className="flex cursor-pointer items-start gap-2 font-sans text-sm text-[#555]">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#ccc]"
              />
              <span>I&apos;d like to receive product updates and offers from Chromax-MCR</span>
            </label>
            {error ? (
              <div className="rounded-lg border border-[#A32D2D]/40 bg-[#A32D2D]/10 px-3 py-2 font-sans text-sm text-[#A32D2D]">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              Create account
            </Button>
            <RecaptchaLegalNote />
          </form>
        ) : (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1D9E75]/15 text-2xl text-[#1D9E75]">
              ✓
            </div>
            <h2 className="mt-4 font-sans text-xl font-semibold text-[#1a1a2e]">Account created!</h2>
            <p className="mt-2 font-sans text-sm text-[#555]">
              We&apos;ve sent a confirmation email to {email}. Please check your inbox and confirm your address before
              signing in.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex font-sans text-sm font-medium text-[#185FA5] hover:underline"
            >
              Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
