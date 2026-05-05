export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "gold" | "navy" | "white" | "current";
  className?: string;
}

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

const colorClasses: Record<NonNullable<SpinnerProps["color"]>, string> = {
  gold: "border-[var(--color-gold)] border-t-transparent text-[var(--color-gold)]",
  navy: "border-[var(--color-navy)] border-t-transparent text-[var(--color-navy)]",
  white: "border-[#F5F5F4] border-t-transparent text-[#F5F5F4]",
  current: "border-current border-t-transparent",
};

export function Spinner({
  size = "md",
  color = "current",
  className = "",
}: SpinnerProps) {
  return (
    <span
      className={[
        "inline-block rounded-full animate-spin motion-reduce:animate-none",
        "motion-reduce:border-t-current motion-reduce:opacity-80",
        sizeClasses[size],
        colorClasses[color],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Loading"
      role="status"
    />
  );
}
