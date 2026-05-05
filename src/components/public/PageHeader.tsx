import type { ReactNode } from "react";

export interface PageHeaderProps {
  badge: string;
  heading: string;
  subtext?: string;
  /** Default navy hero bar; `charcoal` for projects listing */
  variant?: "navy" | "charcoal";
  className?: string;
  children?: ReactNode;
}

export function PageHeader({
  badge,
  heading,
  subtext,
  variant = "navy",
  className = "",
  children,
}: PageHeaderProps) {
  const bg =
    variant === "charcoal" ? "bg-[#2D2D3E]" : "bg-[#1a1a2e]";

  return (
    <section className={`${bg} py-12 sm:py-16 ${className}`.trim()}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <p className="font-sans text-sm font-medium uppercase tracking-wider text-[#E8A020] sm:text-[11px] sm:tracking-widest">
          {badge}
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] mt-3 text-4xl font-semibold text-white sm:text-5xl md:text-[3rem] md:leading-tight">
          {heading}
        </h1>
        {subtext ? (
          <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-white/70 sm:text-lg sm:text-white/60">
            {subtext}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
