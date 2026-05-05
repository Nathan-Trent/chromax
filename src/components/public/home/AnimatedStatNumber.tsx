"use client";

import { parseStatDisplay } from "./stat-utils";
import { useEffect, useRef, useState } from "react";

function AnimatedNumericStat({
  parsed,
  className,
}: {
  parsed: {
    target: number;
    suffix: string;
  };
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? `${parsed.target.toLocaleString("en-US")}${parsed.suffix}`
      : `${(0).toLocaleString("en-US")}${parsed.suffix}`,
  );
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || started.current) return;
        started.current = true;
        obs.disconnect();

        const dur = 1500;
        const start = performance.now();
        const to = parsed.target;

        function tick(now: number) {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - (1 - t) * (1 - t);
          const cur = Math.round(to * eased);
          setShown(`${cur.toLocaleString("en-US")}${parsed.suffix}`);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.2 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [parsed.suffix, parsed.target]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}

export function AnimatedStatNumber({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const parsed = parseStatDisplay(value);

  if (!parsed.isNumeric) {
    return <span className={className}>{parsed.fullDisplay}</span>;
  }

  return <AnimatedNumericStat parsed={parsed} className={className} />;
}
