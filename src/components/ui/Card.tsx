import type { MouseEventHandler, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  accent?: "amber" | "blue" | "teal" | "purple" | "coral" | "green";
  padding?: "sm" | "md" | "lg";
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const accentLeftBorder: Record<
  NonNullable<CardProps["accent"]>,
  string
> = {
  amber: "border-[#BA7517]",
  blue: "border-[#185FA5]",
  teal: "border-[#0F6E56]",
  purple: "border-[#534AB7]",
  coral: "border-[#993C1D]",
  green: "border-[#3B6D11]",
};

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  accent,
  padding = "md",
  className = "",
  onClick,
}: CardProps) {
  const interactiveClasses = onClick
    ? "cursor-pointer shadow-sm transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-md"
    : "";

  const accentClasses = accent
    ? `border border-[#E8E8E4] border-l-4 ${accentLeftBorder[accent]}`
    : "border border-[#E8E8E4]";

  return (
    <div
      onClick={onClick}
      className={[
        "rounded-xl bg-[#FEFDFB]",
        accentClasses,
        paddingClasses[padding],
        interactiveClasses,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
