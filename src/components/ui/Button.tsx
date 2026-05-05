import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps
  extends Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "disabled" | "className" | "children"
  > {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2 text-[13px]",
  lg: "px-5 py-2.5 text-[13px]",
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--color-gold)] text-[var(--color-navy)] hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]",
  outline:
    "border border-[var(--color-navy)] bg-transparent text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--color-navy)] hover:bg-[var(--color-navy)]/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]",
};

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  type = "button",
  className = "",
  onClick,
  children,
}: ButtonProps) {
  const isInactive = disabled || loading;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={isInactive ? undefined : onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 ease-in-out",
        "font-sans text-[13px] font-medium",
        variantClasses[variant],
        sizeClasses[size],
        isInactive ? "pointer-events-none opacity-50" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      <span className="min-w-0">{children}</span>
    </button>
  );
}
