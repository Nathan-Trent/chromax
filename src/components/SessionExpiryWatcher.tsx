"use client";

import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SessionExpiryWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let dismissTimer: ReturnType<typeof setTimeout> | undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") return;
      if (event !== "SIGNED_OUT") return;
      if (pathname.startsWith("/admin/accept-invite")) return;

      if (dismissTimer) clearTimeout(dismissTimer);
      setToast("Your session has ended. Please sign in again.");
      dismissTimer = setTimeout(() => {
        setToast(null);
        if (pathname.startsWith("/admin")) {
          router.replace("/login");
        } else {
          router.replace("/account/login");
        }
      }, 4000);
    });

    return () => {
      subscription.unsubscribe();
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [pathname, router]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl bg-[#1a1a2e] px-4 py-3 font-sans text-sm text-white shadow-lg"
    >
      {toast}
    </div>
  );
}
