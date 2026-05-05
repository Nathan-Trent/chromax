"use client";

import { NotificationBell } from "@/components/admin/NotificationBell";
import { createClient } from "@/lib/supabase/client";
import {
  hasAnyContentNavPermission,
  hasAnyOperationsNavPermission,
  hasPermission,
  isSuperAdmin,
} from "@/lib/auth/permissions";
import type { Role } from "@/types/role";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export interface AdminShellProps {
  user: { id: string; email: string };
  roles: Role[];
  children: ReactNode;
}

const iconClass = "h-4 w-4 shrink-0";

function IconDashboard() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function IconProducts() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function IconSwatches() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function IconPages() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconBlog() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3v4a1 1 0 001 1h4" />
    </svg>
  );
}

function IconProjects() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconCertifications() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 01-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 01-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 01-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 01.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconB2b() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function IconAiLogs() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconWorkflows() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 16l3-3m0 0l3-3m-3 3V4m0 9h-3m3 0h3m-6-5a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconAudit() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconErp() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-[13px] text-white/60",
    "hover:bg-white/[0.08] hover:text-white transition-colors duration-150 ease-in-out motion-reduce:transition-none",
    active ? "bg-white/[0.12] text-white font-medium" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

type NavItem = { href: string; label: string; icon: ReactNode };

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="px-4 pb-1 pt-4 text-[10px] font-medium uppercase tracking-widest text-white/30">{label}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={navLinkClass(isNavActive(pathname, item.href))}>
              {item.icon}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function hasAnyProductsPermission(r: Role[]) {
  return ["view", "create", "edit", "delete", "approve_pricing"].some((a) =>
    hasPermission(r, "products", a),
  );
}

function hasAnySwatchesPermission(r: Role[]) {
  return ["view", "edit"].some((a) => hasPermission(r, "swatches", a));
}

function hasAnyContentPermission(r: Role[]) {
  return ["view", "create", "edit", "delete"].some((a) => hasPermission(r, "content", a));
}

function hasAnyBlogPermission(r: Role[]) {
  return ["view", "create", "edit", "delete"].some((a) => hasPermission(r, "blog", a));
}

function hasAnyProjectsPermission(r: Role[]) {
  return ["view", "edit"].some((a) => hasPermission(r, "projects", a));
}

function hasAnyCertificationsPermission(r: Role[]) {
  return ["view", "edit"].some((a) => hasPermission(r, "certifications", a));
}

function hasAnyOrdersPermission(r: Role[]) {
  return ["view", "fulfil", "cancel_request", "cancel_approve"].some((a) =>
    hasPermission(r, "orders", a),
  );
}

function hasAnyB2bPermission(r: Role[]) {
  return ["view", "respond", "approve"].some((a) => hasPermission(r, "b2b", a));
}

function hasAnyAiLeadsPermission(r: Role[]) {
  return ["view", "create", "edit", "delete"].some((a) => hasPermission(r, "ai_leads", a));
}

export function AdminShell({ user, roles, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMobileNavOpen(false));
  }, [pathname]);

  const roleNames = roles.map((r) => r.name).join(", ");
  const showContentSection = hasAnyContentNavPermission(roles);
  const showOperationsSection = hasAnyOperationsNavPermission(roles);
  const contentItems: NavItem[] = [];
  if (hasAnyProductsPermission(roles)) {
    contentItems.push({ href: "/admin/products", label: "Products", icon: <IconProducts /> });
  }
  if (hasAnySwatchesPermission(roles)) {
    contentItems.push({ href: "/admin/swatches", label: "Colour Swatches", icon: <IconSwatches /> });
  }
  if (hasAnyContentPermission(roles)) {
    contentItems.push({ href: "/admin/content", label: "Pages & Content", icon: <IconPages /> });
  }
  if (hasAnyBlogPermission(roles)) {
    contentItems.push({ href: "/admin/blog", label: "Blog & Guides", icon: <IconBlog /> });
  }
  if (hasAnyProjectsPermission(roles)) {
    contentItems.push({ href: "/admin/projects", label: "Projects", icon: <IconProjects /> });
  }
  if (hasAnyCertificationsPermission(roles)) {
    contentItems.push({
      href: "/admin/certifications",
      label: "Certifications",
      icon: <IconCertifications />,
    });
  }

  const operationsItems: NavItem[] = [];
  if (hasAnyOrdersPermission(roles)) {
    operationsItems.push({ href: "/admin/orders", label: "Orders", icon: <IconOrders /> });
  }
  if (hasAnyB2bPermission(roles)) {
    operationsItems.push({ href: "/admin/b2b", label: "B2B Offers", icon: <IconB2b /> });
  }
  if (hasAnyAiLeadsPermission(roles)) {
    operationsItems.push({ href: "/admin/ai-logs", label: "AI Chat Logs", icon: <IconAiLogs /> });
  }

  const systemItems: NavItem[] = [];
  if (isSuperAdmin(roles)) {
    systemItems.push(
      { href: "/admin/users", label: "Users & Roles", icon: <IconUsers /> },
      { href: "/admin/workflows", label: "Approval Workflows", icon: <IconWorkflows /> },
      { href: "/admin/settings", label: "Settings", icon: <IconSettings /> },
    );
  }
  if (hasPermission(roles, "audit_log", "view")) {
    systemItems.push({ href: "/admin/audit-log", label: "Audit Log", icon: <IconAudit /> });
  }
  if (hasPermission(roles, "erp_sync", "view")) {
    systemItems.push({ href: "/admin/erp-sync", label: "ERP Sync", icon: <IconErp /> });
  }

  const overviewItems: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const [sessionLine, setSessionLine] = useState<string>("");
  const [sessionUrgent, setSessionUrgent] = useState<"none" | "amber" | "red">("none");

  useEffect(() => {
    const supabase = createClient();

    function formatRemaining(expiresAtSec: number): { line: string; urgent: "none" | "amber" | "red" } {
      const secLeft = Math.max(0, expiresAtSec - Math.floor(Date.now() / 1000));
      const totalM = Math.floor(secLeft / 60);
      const h = Math.floor(totalM / 60);
      const m = totalM % 60;
      const line = `Session: ${h}h ${m}m remaining`;
      if (totalM < 2) return { line, urgent: "red" };
      if (totalM < 10) return { line, urgent: "amber" };
      return { line, urgent: "none" };
    }

    async function tick() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const exp = session?.expires_at;
      if (!exp) {
        setSessionLine("");
        setSessionUrgent("none");
        return;
      }
      const { line, urgent } = formatRemaining(exp);
      setSessionLine(line);
      setSessionUrgent(urgent);
    }

    void tick();
    const interval = setInterval(() => void tick(), 60_000);
    return () => clearInterval(interval);
  }, []);

  const sidebarInner = (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0">
            <Image
              src="/images/chromax-logo.png"
              alt="Chromax-MCR"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </Link>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-white/40">Admin</p>
      </div>
      <div className="border-b border-white/10 px-5 py-3">
        <p className="truncate text-xs text-white/60" title={user.email}>
          {user.email}
        </p>
        <p className="mt-0.5 text-[10px] text-white/40">{roleNames || "No roles assigned"}</p>
      </div>
      <nav className="flex flex-1 flex-col overflow-y-auto py-2">
        <NavSection label="Overview" items={overviewItems} pathname={pathname} />
        {showContentSection ? <NavSection label="Content" items={contentItems} pathname={pathname} /> : null}
        {showOperationsSection ? (
          <NavSection label="Operations" items={operationsItems} pathname={pathname} />
        ) : null}
        {systemItems.length > 0 ? (
          <NavSection label="System" items={systemItems} pathname={pathname} />
        ) : null}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="text-xs text-white/40 transition-colors duration-150 hover:text-white motion-reduce:transition-none"
        >
          Sign out
        </button>
        {sessionLine ? (
          <div className="mt-3 space-y-1">
            <p
              className={[
                "font-sans text-[10px]",
                sessionUrgent === "red"
                  ? "text-[#A32D2D]"
                  : sessionUrgent === "amber"
                    ? "text-[#BA7517]"
                    : "text-white/25",
              ].join(" ")}
            >
              {sessionLine}
            </p>
            {sessionUrgent === "red" ? (
              <p className="font-sans text-[10px] text-[#A32D2D]">Session expiring soon — save your work</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col bg-[#1a1a2e] transition-transform duration-200 ease-out motion-reduce:transition-none lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {sidebarInner}
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-[240px]">
        <header className="hidden h-14 shrink-0 items-center justify-end border-b border-[#E8E8E4] bg-[#F5F0E8] px-6 lg:flex">
          <NotificationBell userId={user.id} variant="desktop" />
        </header>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8E8E4] bg-[#F5F0E8] px-4 lg:hidden">
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-lg p-2 text-[#1a1a2e] hover:bg-black/5"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="h-8 w-8 shrink-0">
              <Image
                src="/images/chromax-logo.png"
                alt="Chromax-MCR"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-sans text-sm font-medium text-[#1a1a2e]">Admin</span>
          </div>
          <NotificationBell userId={user.id} variant="mobile" />
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
