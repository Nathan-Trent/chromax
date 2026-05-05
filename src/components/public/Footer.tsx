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
  return "mb-2 block min-h-11 rounded py-3 font-sans text-sm text-[rgba(255,255,255,0.65)] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:text-white sm:min-h-0 sm:p-0 sm:text-[13px]";
}

export function Footer() {
  return (
    <footer className="w-full overflow-x-hidden bg-[#1a1a2e] pt-12 pb-10 sm:pt-16 sm:pb-12">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3">
          <div className="w-full sm:col-span-2 lg:col-span-1 lg:max-w-md">
            <LogoBlock />
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-[rgba(255,255,255,0.5)] sm:text-[14px]">
              Engineered for precision. Built for the world.
            </p>
            <p className="mt-2 font-sans text-sm text-[rgba(255,255,255,0.4)] sm:text-[12px]">
              Ikotun, Lagos, Nigeria
            </p>
          </div>

          <div>
            <p className="mb-4 font-sans text-sm font-medium uppercase tracking-widest text-[rgba(255,255,255,0.4)] sm:text-[11px]">
              Products
            </p>
            <Link href="/products?category=industrial" className={footerLinkClass()}>
              Industrial Coatings
            </Link>
            <Link href="/products?category=marine" className={footerLinkClass()}>
              Marine Coatings
            </Link>
            <Link href="/products?category=automotive" className={footerLinkClass()}>
              Automotive Finishes
            </Link>
            <Link href="/products?category=architectural" className={footerLinkClass()}>
              Architectural Paint
            </Link>
            <Link href="/products?category=custom" className={footerLinkClass()}>
              Custom Formulations
            </Link>
          </div>

          <div>
            <p className="mb-4 font-sans text-sm font-medium uppercase tracking-widest text-[rgba(255,255,255,0.4)] sm:text-[11px]">
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
            <p className="mt-6 font-sans text-sm text-[rgba(255,255,255,0.35)] sm:text-[11px]">
              UK · USA · Ukraine
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:mt-12 sm:flex-row sm:items-center">
          <p className="font-sans text-sm text-[rgba(255,255,255,0.35)] sm:text-[12px]">
            © 2025 Chromax-MCR. All rights reserved.
          </p>
          <p className="font-sans text-sm text-[rgba(255,255,255,0.35)] sm:text-[12px]">
            Made in Lagos · Trusted worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
