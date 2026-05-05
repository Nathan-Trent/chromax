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
  "inline-flex items-center justify-center gap-2 rounded-lg font-sans text-[13px] font-medium transition-colors duration-150 ease-in-out motion-reduce:transition-none px-3 py-1.5 bg-[var(--color-gold)] text-[var(--color-navy)] hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]";

function LogoBlock() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3">
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
      <span className="flex flex-col gap-0">
        <span className="font-sans text-[15px] font-medium leading-tight text-white">
          CHROMAX-MCR
        </span>
        <span className="font-sans text-[10px] font-medium uppercase tracking-widest text-[rgba(255,255,255,0.45)]">
          Industrial Coatings
        </span>
      </span>
    </Link>
  );
}

function navLinkClass(active: boolean) {
  return [
    "font-sans text-[13px] transition-colors duration-150 ease-in-out motion-reduce:transition-none",
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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 w-full bg-[#1a1a2e]">
      <div className="relative mx-auto flex h-full w-full max-w-none items-center justify-between px-4 sm:px-6 lg:px-8">
        <LogoBlock />

        <nav
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 lg:flex"
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
            className="rounded border-[0.5px] border-[rgba(255,255,255,0.2)] px-2.5 py-1 font-sans text-[12px] leading-none text-[rgba(255,255,255,0.6)] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:text-white"
            aria-label={`Currency: ${currency}. Click to cycle.`}
          >
            {currency}
          </button>
          <Link
            href="/cart"
            className="relative flex items-center justify-center text-white"
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
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E8A020] px-1 font-sans text-[10px] font-semibold tabular-nums text-[#1a1a2e]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          <Link href="/contact" className={quoteButtonSmClass}>
            Get a quote
          </Link>
        </div>

        <button
          type="button"
          className="flex items-center justify-center text-white lg:hidden"
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

      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          className="absolute top-16 right-0 left-0 z-50 w-full bg-[#1a1a2e] shadow-lg lg:hidden"
        >
          <nav className="flex flex-col" aria-label="Mobile primary">
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className={[
                    "block px-6 py-3 font-sans text-base text-white transition-colors duration-150",
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
          <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-6">
            <Link
              href="/cart"
              onClick={closeMenu}
              className="relative inline-flex w-fit items-center gap-2 font-sans text-base text-white"
            >
              Cart
              {cartCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8A020] px-1 font-sans text-[11px] font-semibold text-[#1a1a2e]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={cycleCurrency}
              className="self-start rounded border-[0.5px] border-[rgba(255,255,255,0.2)] px-2.5 py-1 font-sans text-[12px] text-[rgba(255,255,255,0.6)]"
              aria-label={`Currency: ${currency}. Click to cycle.`}
            >
              {currency}
            </button>
            <Link
              href="/contact"
              onClick={closeMenu}
              className={`${quoteButtonSmClass} w-full justify-center sm:w-auto`}
            >
              Get a quote
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
