"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Supabase Auth → URL Configuration must include:
 * - Site URL: https://your-domain.com
 * - Redirect URLs: https://your-domain.com/admin/accept-invite
 * This allows Supabase to redirect invite tokens to our custom page.
 *
 * @supabase/ssr createBrowserClient uses flowType: "pkce", which does not parse
 * implicit grant tokens in the URL hash. Invites arrive as #access_token=…&type=invite;
 * we read the hash and call auth.setSession() so the session is established.
 */

type Phase = "loading" | "invalid" | "form" | "success";

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

export default function AcceptInvitePage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function processInviteToken() {
      const hash = window.location.hash;
      if (!hash) {
        if (!cancelled) setPhase("invalid");
        return;
      }

      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (!accessToken || !refreshToken) {
        if (!cancelled) setPhase("invalid");
        return;
      }

      if (type !== "invite" && type !== "signup") {
        if (!cancelled) setPhase("invalid");
        return;
      }

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session?.user) {
          console.error("setSession error:", error);
          if (!cancelled) setPhase("invalid");
          return;
        }

        const user = data.session.user;
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        const nameRaw = meta?.full_name ?? meta?.name ?? "";
        const name = typeof nameRaw === "string" ? nameRaw : "";

        if (name && !cancelled) setFullName(name);

        window.history.replaceState(null, "", window.location.pathname);

        if (!cancelled) setPhase("form");
      } catch (err) {
        console.error("Invite processing error:", err);
        if (!cancelled) setPhase("invalid");
      }
    }

    void processInviteToken();

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
    setSubmitting(true);
    const supabase = createClient();

    try {
      const { error: upErr } = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName.trim() },
      });

      if (upErr) {
        setError(upErr.message);
        return;
      }

      await supabase.auth.signOut();
      setPhase("success");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e] font-sans text-sm text-white/70">
        Verifying invitation…
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
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
          <h1 className="mt-4 font-sans text-xl font-semibold text-[#1a1a2e]">Invitation unavailable</h1>
          <p className="mt-2 font-sans text-sm text-[#555]">
            This invitation link is invalid or has expired. Contact your administrator for a new invitation.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex font-sans text-sm font-medium text-[#185FA5] hover:underline"
          >
            Back to admin login
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1D9E75]/15 text-2xl">
            ✓
          </div>
          <h1 className="mt-4 font-sans text-xl font-semibold text-[#1a1a2e]">Password set successfully!</h1>
          <p className="mt-2 font-sans text-sm text-[#555]">
            You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-(--color-gold) px-4 py-2.5 font-sans text-[13px] font-medium text-(--color-navy) hover:bg-[#D49215]"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const s = strengthLabel(password);

  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a2e] px-4 py-8">
      <div className="mx-auto mt-[10vh] w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
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
            Welcome to Chromax-MCR
          </h1>
          <p className="mt-2 text-center font-sans text-sm text-[#555]">
            You&apos;ve been invited to join the admin dashboard. Set a password to activate your account.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <div>
            <Input
              label="New password"
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
          {error ? (
            <div className="rounded-lg border border-[#A32D2D]/40 bg-[#A32D2D]/10 px-3 py-2 font-sans text-sm text-[#A32D2D]">
              {error}
            </div>
          ) : null}
          <Button type="submit" className="w-full" loading={submitting} disabled={submitting}>
            Activate account
          </Button>
        </form>
      </div>
    </div>
  );
}
