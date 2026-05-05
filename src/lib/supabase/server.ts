import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * **Server-only.** Use `createClient()` from Server Components, Route Handlers,
 * and Server Actions so cookies can be forwarded on each request.
 * Never import this from Client Components or `proxy.ts` / the browser bundle —
 * use `@/lib/supabase/client` instead.
 *
 * `cookies()` is async in Next.js 15+ and must be awaited.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* Server Component cannot set cookies; session refresh runs in middleware. */
          }
          void headers;
        },
      },
    },
  );
}
