"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useMemo, useRef } from "react";

export function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
  const threshold = options?.threshold ?? 0.12;
  const rootMargin = options?.rootMargin ?? "0px 0px -6% 0px";
  const obsRef = useRef<IntersectionObserver | null>(null);

  return useCallback(
    (node: HTMLElement | null) => {
      obsRef.current?.disconnect();
      obsRef.current = null;
      if (!node) return;

      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        node.classList.add("revealed");
        return;
      }

      const obs = new IntersectionObserver(
        (entries, observer) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("revealed");
              observer.unobserve(e.target);
            }
          }
        },
        { threshold, rootMargin },
      );

      obs.observe(node);
      obsRef.current = obs;
    },
    [threshold, rootMargin],
  );
}

/** Per-item transition delays for staggered scroll reveals (pair with `useScrollReveal` / `ScrollReveal`). */
export function useStaggerReveal(count: number, delayBetween = 80) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        style: { transitionDelay: `${i * delayBetween}ms` } satisfies CSSProperties,
      })),
    [count, delayBetween],
  );
}

export function ScrollReveal({
  children,
  className = "",
  style,
  variant = "up",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: "up" | "left" | "right";
}) {
  const ref = useScrollReveal();
  const base =
    variant === "left" ? "reveal-left" : variant === "right" ? "reveal-right" : "reveal-up";
  return (
    <div ref={ref} className={`${base} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
