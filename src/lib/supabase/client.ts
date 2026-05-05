import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * **Browser-only.** Call `createClient()` only from files that start with
 * `'use client'` (Client Components, client hooks, client event handlers).
 * Do not import this module from Server Components, Route Handlers, or
 * `proxy.ts` / Edge — use `@/lib/supabase/server` or `updateSession` instead.
 */
let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return browserClient;
}
