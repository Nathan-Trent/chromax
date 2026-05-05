"use client";

import { useState } from "react";

export interface ProductAccordionProps {
  description: string | null;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-[#888] transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductAccordion({ description }: ProductAccordionProps) {
  const [descOpen, setDescOpen] = useState(true);
  const [appOpen, setAppOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setDescOpen((o) => !o)}
        className="flex w-full items-center justify-between border-b border-[#E0DED4] py-4 text-left font-sans text-[15px] font-medium text-[#1a1a2e]"
        aria-expanded={descOpen}
      >
        Product description
        <Chevron open={descOpen} />
      </button>
      {descOpen ? (
        <div className="border-b border-[#E0DED4] py-4 font-sans text-[15px] leading-relaxed text-[#555]">
          {description?.trim() ? description : "No description available yet."}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setAppOpen((o) => !o)}
        className="flex w-full items-center justify-between border-b border-[#E0DED4] py-4 text-left font-sans text-[15px] font-medium text-[#1a1a2e]"
        aria-expanded={appOpen}
      >
        Application notes
        <Chevron open={appOpen} />
      </button>
      {appOpen ? (
        <div className="border-b border-[#E0DED4] py-4 font-sans text-[15px] leading-relaxed text-[#555]">
          Full application guide available in the TDS PDF
        </div>
      ) : null}
    </div>
  );
}
