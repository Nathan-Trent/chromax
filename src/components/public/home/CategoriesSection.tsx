"use client";

import { ScrollReveal, useScrollReveal } from "@/lib/animations/useScrollReveal";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CategoriesSectionProps {
  label: string;
  heading: string;
  subtext: string;
}

const CATEGORIES = [
  {
    id: "industrial",
    name: "Industrial",
    desc: "Machinery & infrastructure",
    icon: "⚙️",
    color: "#185FA5",
    lightColor: "#E6F1FB",
    href: "/products?category=industrial",
  },
  {
    id: "marine",
    name: "Marine",
    desc: "Vessels & offshore",
    icon: "⚓",
    color: "#0F6E56",
    lightColor: "#E1F5EE",
    href: "/products?category=marine",
  },
  {
    id: "automotive",
    name: "Automotive",
    desc: "Premium finishes",
    icon: "🚗",
    color: "#993C1D",
    lightColor: "#FAECE7",
    href: "/products?category=automotive",
  },
  {
    id: "architectural",
    name: "Architectural",
    desc: "Walls & buildings",
    icon: "🏠",
    color: "#BA7517",
    lightColor: "#FAEEDA",
    href: "/products?category=architectural",
  },
  {
    id: "custom",
    name: "Custom",
    desc: "Bespoke formulations",
    icon: "🧪",
    color: "#534AB7",
    lightColor: "#EEEDFE",
    href: "/products?category=custom",
  },
] as const;

function CategoryCard({
  cat,
  delayMs,
  tiltEnabled,
}: {
  cat: (typeof CATEGORIES)[number];
  delayMs: number;
  tiltEnabled: boolean;
}) {
  const revealRef = useScrollReveal();
  const cardRef = useRef<HTMLAnchorElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLAnchorElement | null) => {
      revealRef(node);
      cardRef.current = node;
    },
    [revealRef],
  );

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!tiltEnabled || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      cardRef.current.style.transform = `perspective(1000px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-8px) scale(1.02)`;
    },
    [tiltEnabled],
  );

  const onLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "";
  }, []);

  return (
    <Link
      href={cat.href}
      ref={setRefs}
      onMouseMove={onMove}
      onMouseLeave={(e) => {
        onLeave();
        const t = e.currentTarget;
        t.style.borderColor = "";
        t.style.backgroundColor = "";
        t.style.boxShadow = "";
      }}
      onMouseEnter={(e) => {
        const t = e.currentTarget;
        t.style.borderColor = cat.color;
        t.style.backgroundColor = cat.lightColor;
        t.style.boxShadow = `0 20px 40px ${cat.color}33`;
      }}
      className="reveal-up group flex h-full min-h-[200px] w-full flex-col items-center rounded-xl border border-[#E8E8E4] bg-white p-6 text-center transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none lg:hover:translate-y-0 lg:hover:scale-100 lg:hover:shadow-none"
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
    >
      <span className="mb-4 text-5xl" aria-hidden>
        {cat.icon}
      </span>
      <span className="font-sans text-[15px] font-semibold text-[#1a1a2e]">{cat.name}</span>
      <span className="mt-1 font-sans text-[12px] text-[#888888]">{cat.desc}</span>
      <span
        className="mt-3 font-sans text-sm font-medium opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transform-none"
        style={{ color: cat.color, transform: "translateX(-4px)" }}
      >
        →
      </span>
    </Link>
  );
}

export function CategoriesSection({ label, heading, subtext }: CategoriesSectionProps) {
  const [tilt, setTilt] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setTilt(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <section className="bg-[#F5F0E8] py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <ScrollReveal className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888888]">
            {label}
          </p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[#1a1a2e] md:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 font-sans text-[15px] text-[#555555]">{subtext}</p>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:flex lg:flex-nowrap lg:justify-center lg:gap-6">
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.id}
              className="lg:w-[calc(20%-24px)] lg:min-w-[180px]"
            >
              <CategoryCard cat={cat} delayMs={i * 80} tiltEnabled={tilt} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
