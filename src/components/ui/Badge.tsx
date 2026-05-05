import type { ReactNode } from "react";

export interface BadgeProps {
  variant?:
    | "amber"
    | "blue"
    | "teal"
    | "purple"
    | "coral"
    | "green"
    | "navy"
    | "default";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<
  NonNullable<BadgeProps["variant"]>,
  string
> = {
  amber: "bg-[#BA7517]/15 text-[#633806]",
  blue: "bg-[#185FA5]/15 text-[#0F3D6B]",
  teal: "bg-[#0F6E56]/15 text-[#0A4A3A]",
  purple: "bg-[#534AB7]/15 text-[#2E2866]",
  coral: "bg-[#993C1D]/15 text-[#5C240F]",
  green: "bg-[#3B6D11]/15 text-[#234009]",
  navy: "bg-[var(--color-navy)] text-white",
  default: "bg-[#E5E5E0] text-[#444444]",
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2.5 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

export function Badge({
  variant = "default",
  size = "sm",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
