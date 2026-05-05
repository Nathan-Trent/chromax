import Image from "next/image";
import Link from "next/link";

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

function footerLinkClass() {
  return "mb-2 block font-sans text-[13px] text-[rgba(255,255,255,0.65)] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:text-white";
}

export function Footer() {
  return (
    <footer className="w-full bg-[#1a1a2e] pt-16 pb-12">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div>
            <LogoBlock />
            <p className="mt-4 max-w-xs font-sans text-[14px] leading-relaxed text-[rgba(255,255,255,0.5)]">
              Engineered for precision. Built for the world.
            </p>
            <p className="mt-2 font-sans text-[12px] text-[rgba(255,255,255,0.4)]">
              Ikotun, Lagos, Nigeria
            </p>
          </div>

          <div>
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
              Products
            </p>
            <Link
              href="/products?category=industrial"
              className={footerLinkClass()}
            >
              Industrial Coatings
            </Link>
            <Link href="/products?category=marine" className={footerLinkClass()}>
              Marine Coatings
            </Link>
            <Link
              href="/products?category=automotive"
              className={footerLinkClass()}
            >
              Automotive Finishes
            </Link>
            <Link
              href="/products?category=architectural"
              className={footerLinkClass()}
            >
              Architectural Paint
            </Link>
            <Link href="/products?category=custom" className={footerLinkClass()}>
              Custom Formulations
            </Link>
          </div>

          <div>
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
              Company
            </p>
            <Link href="/about" className={footerLinkClass()}>
              About Us
            </Link>
            <Link href="/certifications" className={footerLinkClass()}>
              Certifications
            </Link>
            <Link href="/projects" className={footerLinkClass()}>
              Projects
            </Link>
            <Link href="/blog" className={footerLinkClass()}>
              Blog
            </Link>
            <Link href="/contact" className={footerLinkClass()}>
              Contact
            </Link>
            <p className="mt-6 font-sans text-[11px] text-[rgba(255,255,255,0.35)]">
              UK · USA · Ukraine
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="font-sans text-[12px] text-[rgba(255,255,255,0.35)]">
            © 2025 Chromax-MCR. All rights reserved.
          </p>
          <p className="font-sans text-[12px] text-[rgba(255,255,255,0.35)]">
            Made in Lagos · Trusted worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
