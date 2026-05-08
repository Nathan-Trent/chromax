"use client";

import { ScrollReveal, useScrollReveal } from "@/lib/animations/useScrollReveal";
import type { HomepageContent } from "@/lib/content/homepage";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CategoriesCardsContent = Pick<
  HomepageContent,
  | "cat_industrial_name"
  | "cat_industrial_desc"
  | "cat_industrial_emoji"
  | "cat_marine_name"
  | "cat_marine_desc"
  | "cat_marine_emoji"
  | "cat_automotive_name"
  | "cat_automotive_desc"
  | "cat_automotive_emoji"
  | "cat_architectural_name"
  | "cat_architectural_desc"
  | "cat_architectural_emoji"
  | "cat_custom_name"
  | "cat_custom_desc"
  | "cat_custom_emoji"
>;

export interface CategoriesSectionProps {
  label: string;
  heading: string;
  subtext: string;
  cards: CategoriesCardsContent;
}

function CategoryCard({
  cat,
  delayMs,
  tiltEnabled,
}: {
  cat: {
    id: string;
    name: string;
    desc: string;
    icon: string;
    color: string;
    lightColor: string;
    href: string;
  };
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
      className="reveal-up group flex h-full min-h-[200px] w-full flex-col items-center rounded-xl border border-[#E8E8E4] bg-white p-4 text-center transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none sm:p-6 lg:hover:translate-y-0 lg:hover:scale-100 lg:hover:shadow-none"
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

export function CategoriesSection({ label, heading, subtext, cards }: CategoriesSectionProps) {
  const [tilt, setTilt] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setTilt(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const CATEGORY_ROWS = useMemo(
    () =>
      [
        {
          id: "industrial",
          name: cards.cat_industrial_name,
          desc: cards.cat_industrial_desc,
          icon: cards.cat_industrial_emoji,
          color: "#185FA5",
          lightColor: "#E6F1FB",
          href: "/products?category=industrial",
        },
        {
          id: "marine",
          name: cards.cat_marine_name,
          desc: cards.cat_marine_desc,
          icon: cards.cat_marine_emoji,
          color: "#0F6E56",
          lightColor: "#E1F5EE",
          href: "/products?category=marine",
        },
        {
          id: "automotive",
          name: cards.cat_automotive_name,
          desc: cards.cat_automotive_desc,
          icon: cards.cat_automotive_emoji,
          color: "#993C1D",
          lightColor: "#FAECE7",
          href: "/products?category=automotive",
        },
        {
          id: "architectural",
          name: cards.cat_architectural_name,
          desc: cards.cat_architectural_desc,
          icon: cards.cat_architectural_emoji,
          color: "#BA7517",
          lightColor: "#FAEEDA",
          href: "/products?category=architectural",
        },
        {
          id: "custom",
          name: cards.cat_custom_name,
          desc: cards.cat_custom_desc,
          icon: cards.cat_custom_emoji,
          color: "#534AB7",
          lightColor: "#EEEDFE",
          href: "/products?category=custom",
        },
      ] as const,
    [cards],
  );

  return (
    <section className="bg-[#F5F0E8] py-16 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 font-sans text-sm font-medium uppercase tracking-widest text-[#888888] sm:text-[11px]">
            {label}
          </p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[#1a1a2e] md:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 font-sans text-[15px] text-[#555555]">{subtext}</p>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:flex lg:flex-nowrap lg:justify-center lg:gap-6">
          {CATEGORY_ROWS.map((cat, i) => (
            <div
              key={cat.id}
              className={[
                "lg:w-[calc(20%-24px)] lg:min-w-[180px]",
                i === CATEGORY_ROWS.length - 1 && CATEGORY_ROWS.length % 2 === 1
                  ? "col-span-2 flex justify-center md:col-span-1 md:block"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div
                className={
                  i === CATEGORY_ROWS.length - 1 && CATEGORY_ROWS.length % 2 === 1
                    ? "w-full max-w-[min(280px,calc(100vw-5rem))] md:max-w-none"
                    : "w-full"
                }
              >
                <CategoryCard cat={cat} delayMs={i * 80} tiltEnabled={tilt} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
