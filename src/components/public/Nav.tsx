"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";

type CurrencyCode = "NGN" | "USD" | "GBP";

const CURRENCY_KEY = "chromax_currency";
const CURRENCY_ORDER: CurrencyCode[] = ["NGN", "USD", "GBP"];

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/colour-lab", label: "Colour Lab" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

const quoteButtonSmClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg font-sans text-sm font-medium transition-colors duration-150 ease-in-out motion-reduce:transition-none px-3 py-2 sm:text-[13px] sm:py-1.5 bg-[var(--color-gold)] text-[var(--color-navy)] hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]";

function LogoBlock() {
  return (
    <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
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
      <span className="flex min-w-0 flex-col gap-0">
        <span className="truncate font-sans text-[13px] font-medium leading-tight text-white sm:text-[15px]">
          CHROMAX-MCR
        </span>
        <span className="hidden font-sans text-[10px] font-medium uppercase tracking-widest text-[rgba(255,255,255,0.45)] sm:block">
          Industrial Coatings
        </span>
      </span>
    </Link>
  );
}

function navLinkClass(active: boolean) {
  return [
    "font-sans text-sm transition-colors duration-150 ease-in-out motion-reduce:transition-none sm:text-[13px]",
    active
      ? "border-b-2 border-[#E8A020] pb-0.5 text-white"
      : "border-b-2 border-transparent pb-0.5 text-[rgba(255,255,255,0.7)] hover:text-white",
  ].join(" ");
}

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem(CURRENCY_KEY) as CurrencyCode | null;
      if (stored && CURRENCY_ORDER.includes(stored)) {
        setCurrency(stored);
      }
    });
  }, []);

  function cycleCurrency() {
    const i = CURRENCY_ORDER.indexOf(currency);
    const next = CURRENCY_ORDER[(i + 1) % CURRENCY_ORDER.length];
    setCurrency(next);
    localStorage.setItem(CURRENCY_KEY, next);
  }

  const cartCount = useCartStore((s) => s.getItemCount());

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 w-full min-w-0 bg-[#1a1a2e]">
      <div className="relative mx-auto flex h-full w-full min-w-0 max-w-none items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <LogoBlock />

        <nav
          className="absolute top-1/2 left-1/2 hidden min-w-0 max-w-none -translate-x-1/2 -translate-y-1/2 items-center gap-6 lg:flex lg:gap-8"
          aria-label="Primary"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={navLinkClass(active)}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <button
            type="button"
            onClick={cycleCurrency}
            className="min-h-11 min-w-[44px] rounded border-[0.5px] border-[rgba(255,255,255,0.2)] px-2.5 font-sans text-sm leading-none text-[rgba(255,255,255,0.6)] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:text-white sm:text-[12px]"
            aria-label={`Currency: ${currency}. Click to cycle.`}
          >
            {currency}
          </button>
          <Link
            href="/cart"
            className="relative flex min-h-11 min-w-11 items-center justify-center text-white"
            aria-label="Shopping cart"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="20" r="1" fill="currentColor" />
              <circle cx="17" cy="20" r="1" fill="currentColor" />
            </svg>
            {cartCount > 0 ? (
              <span className="absolute -top-1 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8A020] px-1 font-sans text-xs font-semibold tabular-nums text-[#1a1a2e] sm:-top-2 sm:-right-2 sm:h-4 sm:min-w-4 sm:text-[10px]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          <Link href="/contact" className={quoteButtonSmClass}>
            Get a quote
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:hidden">
          <button
            type="button"
            onClick={cycleCurrency}
            className="min-h-11 min-w-[44px] rounded border-[0.5px] border-[rgba(255,255,255,0.2)] px-2 font-sans text-sm text-[rgba(255,255,255,0.75)] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:text-white"
            aria-label={`Currency: ${currency}. Click to cycle.`}
          >
            {currency}
          </button>
          <Link
            href="/cart"
            className="relative flex min-h-11 min-w-11 items-center justify-center text-white"
            aria-label="Shopping cart"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="20" r="1" fill="currentColor" />
              <circle cx="17" cy="20" r="1" fill="currentColor" />
            </svg>
            {cartCount > 0 ? (
              <span className="absolute top-1 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8A020] px-1 font-sans text-xs font-semibold text-[#1a1a2e]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center text-white"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          className="absolute top-16 right-0 left-0 z-50 max-h-[calc(100dvh-4rem)] w-full overflow-y-auto bg-[#1a1a2e] shadow-lg lg:hidden"
        >
          <nav className="flex flex-col pb-6" aria-label="Mobile primary">
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className={[
                    "flex min-h-11 items-center px-6 py-3 font-sans text-base text-white transition-colors duration-150",
                    active ? "bg-white/5" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {active ? (
                    <span className="border-b-2 border-[#E8A020] pb-0.5">
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-6">
            <Link
              href="/contact"
              onClick={closeMenu}
              className={`${quoteButtonSmClass} w-full justify-center`}
            >
              Get a quote
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
