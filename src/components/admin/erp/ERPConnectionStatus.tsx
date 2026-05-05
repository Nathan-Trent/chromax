"use client";

import { useCallback, useEffect, useState } from "react";

type HealthState =
  | { kind: "loading" }
  | { kind: "connected"; lastPing: string }
  | { kind: "degraded"; message: string }
  | { kind: "not_connected"; message: string };

export function ERPConnectionStatus() {
  const [state, setState] = useState<HealthState>({ kind: "loading" });

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/erp-sync/health", { cache: "no-store" });
      if (!res.ok) {
        setState({
          kind: "not_connected",
          message: "ERP module not yet installed. See Front Sync setup guide.",
        });
        return;
      }
      const json = (await res.json()) as {
        status?: string;
        timestamp?: string;
        error?: string;
      };

      if (json.status === "not_configured") {
        setState({
          kind: "not_connected",
          message: "ERP module not yet installed. See Front Sync setup guide.",
        });
        return;
      }

      if (json.status === "ok" && json.timestamp) {
        setState({ kind: "connected", lastPing: json.timestamp });
        return;
      }

      setState({
        kind: "degraded",
        message: json.error ?? "Connection to ERP failed.",
      });
    } catch {
      setState({
        kind: "not_connected",
        message: "ERP module not yet installed. See Front Sync setup guide.",
      });
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void fetchHealth());
    const t = setInterval(() => void fetchHealth(), 30_000);
    return () => clearInterval(t);
  }, [fetchHealth]);

  if (state.kind === "loading") {
    return (
      <div className="rounded-xl bg-white p-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#888888]">Connection status</p>
        <p className="mt-3 font-sans text-sm text-[#555555]">Checking…</p>
      </div>
    );
  }

  if (state.kind === "connected") {
    const formatted = new Date(state.lastPing).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return (
      <div className="rounded-xl bg-white p-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#888888]">Connection status</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1D9E75]" aria-hidden />
          <span className="font-sans text-sm font-medium text-[#1a1a2e]">Connected</span>
        </div>
        <p className="mt-1 font-sans text-xs text-[#555555]">Last ping: {formatted}</p>
      </div>
    );
  }

  if (state.kind === "degraded") {
    return (
      <div className="rounded-xl bg-white p-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#888888]">Connection status</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#BA7517]" aria-hidden />
          <span className="font-sans text-sm font-medium text-[#1a1a2e]">Degraded</span>
        </div>
        <p className="mt-1 font-sans text-xs text-[#A32D2D]">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#888888]">Connection status</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#BBBBBB]" aria-hidden />
        <span className="font-sans text-sm font-medium text-[#1a1a2e]">ERP module not yet installed</span>
      </div>
      <p className="mt-1 font-sans text-xs text-[#555555]">{state.message}</p>
    </div>
  );
}
