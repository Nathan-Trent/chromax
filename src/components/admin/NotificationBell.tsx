"use client";

import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NotifRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
};

function iconForType(t: string): string {
  const map: Record<string, string> = {
    order_new: "📦",
    b2b_offer_new: "🤝",
    approval_pending: "⏳",
    approval_actioned: "✅",
    email_failed: "⚠️",
    email_not_configured: "⚙️",
    erp_sync_failed: "🔄",
    stock_low: "📉",
    staff_invited: "👤",
  };
  return map[t] ?? "🔔";
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 45) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export interface NotificationBellProps {
  userId: string;
  variant: "desktop" | "mobile";
}

export function NotificationBell({ userId, variant }: NotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<NotifRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=20", { credentials: "include" });
      const json = (await res.json()) as {
        data?: { notifications: NotifRow[]; unread_count: number };
        error?: string;
      };
      if (res.ok && json.data) {
        setItems(json.data.notifications);
        setUnreadCount(json.data.unread_count);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => void load(), 60_000);
    queueMicrotask(() => void load());
    return () => clearInterval(interval);
  }, [load, pathname]);

  useEffect(() => {
    const supabase = createClient();
    // Unique topic per mounted bell — AdminShell renders desktop + mobile bells at once;
    // reusing the same channel name makes Supabase reuse an already-subscribed channel
    // and throws: cannot add postgres_changes after subscribe().
    const channel = supabase
      .channel(`admin-notifications:${userId}:${variant}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotifRow | null;
          if (!row?.id) return;
          setItems((prev) => [row, ...prev.filter((p) => p.id !== row.id)]);
          setUnreadCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, variant]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        bellRef.current &&
        !bellRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function markRead(ids?: string[]) {
    try {
      await fetch("/api/admin/notifications/read", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids?.length ? { ids } : {}),
      });
      await load();
    } catch {
      /* ignore */
    }
  }

  async function onItemClick(n: NotifRow) {
    await markRead([n.id]);
    setOpen(false);
    const url = n.data && typeof n.data.url === "string" ? n.data.url : null;
    if (url) router.push(url);
  }

  const badge =
    unreadCount > 9 ? (
      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#A32D2D] px-0.5 font-sans text-[10px] font-semibold text-white">
        9+
      </span>
    ) : unreadCount > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#A32D2D] px-0.5 font-sans text-[10px] font-semibold text-white">
        {unreadCount}
      </span>
    ) : null;

  const bellBtn = (
    <button
      ref={bellRef}
      type="button"
      aria-label="Notifications"
      onClick={() => setOpen((v) => !v)}
      className="relative rounded-lg p-2 text-[#1a1a2e] hover:bg-black/5"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z"
        />
      </svg>
      {badge}
    </button>
  );

  const panel = open ? (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-[9999] mt-2 w-80 max-h-[min(480px,calc(100vh-80px))] overflow-y-auto rounded-xl border border-[#E8E8E4] bg-white shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-[#F0EDE6] px-3 py-2.5">
        <span className="font-sans text-sm font-semibold text-[#1a1a2e]">Notifications</span>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="font-sans text-xs text-[#185FA5] hover:underline"
            onClick={() => void markRead()}
          >
            Mark all read
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center font-sans text-sm text-[#888]">No notifications yet</p>
      ) : (
        <ul className="divide-y divide-[#F0EDE6]">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void onItemClick(n)}
                className={[
                  "flex w-full gap-2 p-3 text-left transition-colors hover:bg-[#faf9f6]",
                  n.read ? "" : "border-l-4 border-[#E8A020] bg-[#FDFCF8]",
                ].join(" ")}
              >
                <span className="shrink-0 text-base leading-none" aria-hidden>
                  {iconForType(n.type)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-sans text-[13px] font-medium text-[#1a1a2e]">{n.title}</span>
                  <span className="mt-0.5 line-clamp-2 font-sans text-xs text-[#555]">{n.message}</span>
                  <span className="mt-1 font-sans text-[11px] text-[#888]">{formatRelative(n.created_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  if (variant === "mobile") {
    return (
      <div className="relative flex shrink-0 items-center">
        {bellBtn}
        {panel}
      </div>
    );
  }

  return (
    <div className="relative flex shrink-0 items-center">
      {bellBtn}
      {panel}
    </div>
  );
}
