"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 20; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          if (!cancelled) setReady(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setSuccess(true);
  }

  if (!ready) {
    return (
      <div className="relative -mt-16 flex min-h-[50vh] items-center justify-center font-sans text-sm text-[#555]">
        Preparing secure reset…
      </div>
    );
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
          <h1 className="mt-4 text-center font-sans text-xl font-semibold text-[#1a1a2e]">Set new password</h1>
        </div>
        {!success ? (
          <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error ? (
              <div className="rounded-lg border border-[#A32D2D]/40 bg-[#A32D2D]/10 px-3 py-2 font-sans text-sm text-[#A32D2D]">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              Update password
            </Button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <p className="font-sans text-sm text-[#555]">Password updated successfully.</p>
            <Link
              href="/account/login"
              className="mt-4 inline-flex font-sans text-sm font-medium text-[#185FA5] hover:underline"
            >
              Sign in with your new password
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
