"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function stripStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function asBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  return fallback;
}

export interface EmailSettingsProps {
  settings: Record<string, unknown>;
}

const NOTIF_KEYS = [
  { key: "order_confirmation", label: "Order confirmation (to customer)" },
  { key: "order_status_update", label: "Order status update (to customer)" },
  { key: "b2b_offer_received", label: "New B2B offer received (to Chromax team)" },
  { key: "b2b_offer_response", label: "B2B offer response (to buyer)" },
  { key: "approval_requested", label: "Approval requested (to approver)" },
  { key: "approval_actioned", label: "Approval actioned (to submitter)" },
  { key: "welcome", label: "Welcome email (to new customer)" },
  { key: "password_reset", label: "Password reset (to customer)" },
  { key: "staff_invite", label: "Staff invitation (to invited staff member)" },
  { key: "erp_sync_review", label: "ERP sync — review required (team)" },
  { key: "erp_sync_auto_applied", label: "ERP sync — auto-applied (team)" },
  { key: "erp_sync_actioned", label: "ERP sync — approved or rejected (team)" },
] as const;

export function EmailSettings({ settings }: EmailSettingsProps) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(() => asBool(settings.email_enabled, false));
  const [smtpHost, setSmtpHost] = useState(() => stripStr(settings.email_smtp_host));
  const [smtpPort, setSmtpPort] = useState(() => Number(stripStr(settings.email_smtp_port, "587")) || 587);
  const [smtpUser, setSmtpUser] = useState(() => stripStr(settings.email_smtp_username));
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(() => asBool(settings.email_smtp_secure, false));
  const [fromName, setFromName] = useState(() => stripStr(settings.email_from_name, "Chromax-MCR"));
  const [fromAddress, setFromAddress] = useState(() =>
    stripStr(settings.email_from_address, "noreply@chromax-mcr.com"),
  );
  const [replyTo, setReplyTo] = useState(() => stripStr(settings.email_reply_to, "info@chromax-mcr.com"));

  const [notif, setNotif] = useState<Record<string, boolean>>(() => {
    const raw = settings.email_notifications;
    const base: Record<string, boolean> = {};
    for (const { key } of NOTIF_KEYS) base[key] = true;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      for (const k of Object.keys(base)) {
        const v = (raw as Record<string, unknown>)[k];
        if (typeof v === "boolean") base[k] = v;
      }
    }
    return base;
  });

  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [logs, setLogs] = useState<
    { id: string; to_email: string; template: string; status: string; created_at: string }[]
  >([]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/email-log");
      const json = (await res.json()) as {
        data?: { logs: typeof logs };
        error?: string;
      };
      if (res.ok && json.data?.logs) setLogs(json.data.logs);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadLogs());
  }, [loadLogs]);

  useEffect(() => {
    if (!ok) return;
    const t = window.setTimeout(() => setOk(null), 3000);
    return () => window.clearTimeout(t);
  }, [ok]);

  async function save() {
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const updates: { key: string; value: unknown }[] = [
        { key: "email_enabled", value: emailEnabled },
        { key: "email_smtp_host", value: smtpHost.trim() },
        { key: "email_smtp_port", value: smtpPort },
        { key: "email_smtp_username", value: smtpUser.trim() },
        { key: "email_smtp_secure", value: smtpSecure },
        { key: "email_from_name", value: fromName.trim() },
        { key: "email_from_address", value: fromAddress.trim() },
        { key: "email_reply_to", value: replyTo.trim() },
        { key: "email_notifications", value: notif },
      ];
      if (smtpPass.trim()) {
        updates.push({ key: "email_smtp_password_encrypted", value: smtpPass.trim() });
      }

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(json.error ?? "Save failed");
        return;
      }
      setOk("Settings saved");
      setSmtpPass("");
      router.refresh();
      void loadLogs();
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setTestMsg(null);
    setTestLoading(true);
    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost.trim() || undefined,
          port: smtpPort,
          username: smtpUser.trim() || undefined,
          password: smtpPass.trim() || undefined,
          secure: smtpSecure,
          from_name: fromName.trim() || undefined,
          from_address: fromAddress.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { data?: { to: string }; error?: string };
      if (!res.ok) {
        setTestMsg(`✗ Failed: ${json.error ?? "Unknown error"}`);
        return;
      }
      if (json.data?.to) {
        setTestMsg(`✓ Test email sent to ${json.data.to}`);
      }
      void loadLogs();
    } finally {
      setTestLoading(false);
    }
  }

  function toggleRow(key: string) {
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <section className="rounded-xl bg-white p-6">
      <h2 className="font-sans text-lg font-medium text-[#1a1a2e]">Email settings</h2>
      <p className="mt-1 font-sans text-sm text-[#666]">Configure SMTP to enable email notifications.</p>

      {err ? (
        <div className="mt-4">
          <Toast variant="error" message={err} onDismiss={() => setErr(null)} />
        </div>
      ) : null}
      {ok ? (
        <div className="mt-4">
          <Toast variant="success" message={ok} onDismiss={() => setOk(null)} />
        </div>
      ) : null}

      <div className="mt-8 space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-sans text-sm font-medium text-[#1a1a2e]">Email enabled</span>
            <button
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              onClick={() => setEmailEnabled((v) => !v)}
              className={[
                "relative h-7 w-12 rounded-full transition-colors",
                emailEnabled ? "bg-[#1D9E75]" : "bg-[#ccc]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  emailEnabled ? "left-6" : "left-0.5",
                ].join(" ")}
              />
            </button>
          </div>
          {!emailEnabled ? (
            <p className="mt-2 rounded-lg bg-[#BA7517]/15 px-3 py-2 font-sans text-xs text-[#633806]">
              Email sending is paused. All processes continue normally — no emails will be sent.
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#888]">SMTP configuration</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="SMTP host"
              placeholder="smtp.gmail.com"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
            />
            <Input
              label="SMTP port"
              type="number"
              value={String(smtpPort)}
              onChange={(e) => setSmtpPort(Number.parseInt(e.target.value, 10) || 587)}
            />
            <Input
              label="Username"
              placeholder="you@example.com"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              helper="Leave blank to keep your existing password. Only enter a new value to change it."
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-sans text-sm text-[#1a1a2e]">Use TLS / SSL — port 465</span>
            <button
              type="button"
              role="switch"
              aria-checked={smtpSecure}
              onClick={() => setSmtpSecure((v) => !v)}
              className={[
                "relative h-7 w-12 rounded-full transition-colors",
                smtpSecure ? "bg-[#1D9E75]" : "bg-[#ccc]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  smtpSecure ? "left-6" : "left-0.5",
                ].join(" ")}
              />
            </button>
          </div>
          <p className="mt-1 font-sans text-xs text-[#666]">
            Enable for port 465. Leave off for port 587 with STARTTLS.
          </p>
          <div className="mt-4 rounded-lg bg-[#E6F1FB] p-3 font-sans text-xs text-[#0C447C]">
            Works with any SMTP provider — Gmail, Outlook, Zoho, custom mail servers, SendGrid, Resend, Postmark,
            Mailgun and others. For Gmail: use an App Password, not your main Google password.
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#888]">From details</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="From name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
            <Input
              label="From email address"
              type="email"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
            />
            <Input
              label="Reply-to address"
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              className="sm:col-span-2"
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#888]">Which events send emails</p>
          <ul className="mt-3 space-y-2">
            {NOTIF_KEYS.map(({ key, label }) => (
              <li key={key} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id={`em-${key}`}
                  checked={notif[key] ?? true}
                  onChange={() => toggleRow(key)}
                  className="mt-1 h-4 w-4 rounded border-[#ccc] text-[#1a1a2e]"
                />
                <label htmlFor={`em-${key}`} className="font-sans text-sm text-[#444]">
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#888]">Test email</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" loading={testLoading} disabled={testLoading} onClick={() => void sendTest()}>
              Test email
            </Button>
          </div>
          {testMsg ? (
            <p
              className={[
                "mt-2 font-sans text-sm",
                testMsg.startsWith("✓") ? "text-[#1D9E75]" : "text-[#A32D2D]",
              ].join(" ")}
            >
              {testMsg}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#888]">Recent email activity</p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-[#E8E8E4]">
            <table className="w-full min-w-[480px] text-left font-sans text-sm">
                <thead className="bg-[#F5F0E8] text-[11px] font-medium uppercase tracking-wide text-[#633806]">
                  <tr>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Template</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-[#888]">
                        No entries yet
                      </td>
                    </tr>
                  ) : (
                    logs.map((row) => (
                      <tr key={row.id} className="border-t border-[#F0EDE6]">
                        <td className="px-3 py-2 text-[#1a1a2e]">{row.to_email}</td>
                        <td className="px-3 py-2 text-[#555]">{row.template}</td>
                        <td className="px-3 py-2">
                          <span
                            className={[
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                              row.status === "sent"
                                ? "bg-[#0F6E56]/15 text-[#0A4A3A]"
                                : row.status === "failed"
                                  ? "bg-[#993C1D]/15 text-[#5C240F]"
                                  : row.status === "pending"
                                    ? "bg-[#185FA5]/15 text-[#0F3D6B]"
                                    : "bg-[#E5E5E0] text-[#444]",
                            ].join(" ")}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-[#888]">
                          {new Date(row.created_at).toLocaleString("en-GB")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </div>

        <Button type="button" loading={loading} disabled={loading} onClick={() => void save()}>
          Save email settings
        </Button>
      </div>
    </section>
  );
}
