import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Minimal identity for route gates in `proxy.ts` (from verified JWT claims). */
export type SessionUser = {
  id: string;
  email?: string;
};

export type UpdateSessionResult = {
  response: NextResponse;
  user: SessionUser | null;
};

/**
 * Refreshes the Supabase Auth session (cookie rotation) for Next.js `proxy`.
 * Uses `getClaims()` per Supabase SSR guidance: validates JWT (often via JWKS
 * with cached keys) and refreshes near-expiry sessions — without calling
 * `GET /auth/v1/user` on every request like `getUser()` does. That `/user`
 * request is a common source of Edge `fetch failed` when outbound HTTPS is
 * flaky, while JWKS + token refresh may still succeed.
 *
 * Do not use `getSession()` here for authorization decisions (unverified cookies).
 *
 * Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure these in .env.local.",
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  let user: SessionUser | null = null;

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (!error && data?.claims?.sub) {
      const emailClaim = data.claims.email;
      user = {
        id: String(data.claims.sub),
        ...(typeof emailClaim === "string" ? { email: emailClaim } : {}),
      };
    }
  } catch {
    /* getClaims may throw on invalid JWT or network errors to JWKS. */
  }

  return { response: supabaseResponse, user };
}
