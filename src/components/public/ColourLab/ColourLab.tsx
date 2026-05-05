"use client";

import { Tabs } from "@/components/ui/Tabs";
import { labCategoryAccent } from "@/lib/design/category-theme";
import type { ColourSwatch } from "@/lib/supabase/queries/swatches";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CarSVG } from "./svgs/CarSVG";
import { HouseSVG } from "./svgs/HouseSVG";
import { IndustrialSVG } from "./svgs/IndustrialSVG";
import { ShipSVG } from "./svgs/ShipSVG";

export type LabCategoryKey = "auto" | "arch" | "marine" | "industrial";

const PARTS_BY_CAT: Record<LabCategoryKey, string[]> = {
  auto: ["body", "roof", "trim", "windows"],
  arch: ["walls", "roof", "door", "windows"],
  marine: ["hull", "deck", "superstructure", "trim"],
  industrial: ["structure", "panels", "pipes", "markings"],
};

const PART_LABELS: Record<string, string> = {
  body: "Body",
  roof: "Roof",
  trim: "Trim",
  windows: "Windows",
  walls: "Walls",
  door: "Door",
  hull: "Hull",
  deck: "Deck",
  superstructure: "Superstructure",
  structure: "Structure",
  panels: "Panels",
  pipes: "Pipes",
  markings: "Markings",
};

const DEFAULT_COLOURS: Record<LabCategoryKey, Record<string, string>> = {
  auto: {
    body: "#C0392B",
    roof: "#2C3E50",
    trim: "#BDC3C7",
    windows: "#AED6F1",
  },
  arch: {
    walls: "#E8DCC8",
    roof: "#6B4423",
    door: "#4A3728",
    windows: "#87CEEB",
  },
  marine: {
    hull: "#1E3A5F",
    deck: "#5D6D7E",
    superstructure: "#BDC3C7",
    trim: "#E8A020",
  },
  industrial: {
    structure: "#4A5568",
    panels: "#A0AEC0",
    pipes: "#718096",
    markings: "#F6E05E",
  },
};

function toFillHex(hex: string) {
  const h = hex.trim().replace(/^#/, "");
  return `#${h.toUpperCase()}`;
}

function normalizeHexForCompare(hex: string) {
  return hex.trim().replace(/^#/, "").toUpperCase();
}

export interface ColourLabProps {
  swatchesByCategory: Record<LabCategoryKey, ColourSwatch[]>;
  initialCategory?: LabCategoryKey;
  initialColour?: string;
  initialPart?: string;
}

export function ColourLab({
  swatchesByCategory,
  initialCategory = "auto",
  initialColour,
  initialPart,
}: ColourLabProps) {
  const router = useRouter();
  const [urlSyncOn, setUrlSyncOn] = useState(false);

  const [activeCategory, setActiveCategory] =
    useState<LabCategoryKey>(initialCategory);

  const [activePart, setActivePart] = useState<string>(() => {
    const parts = PARTS_BY_CAT[initialCategory];
    if (initialPart && parts.includes(initialPart)) return initialPart;
    return parts[0];
  });

  const [partColours, setPartColours] = useState<Record<string, string>>(() => {
    const cat = initialCategory;
    const parts = PARTS_BY_CAT[cat];
    const part =
      initialPart && parts.includes(initialPart) ? initialPart : parts[0];
    let next = { ...DEFAULT_COLOURS[cat] };
    if (initialColour?.trim()) {
      const sw = swatchesByCategory[cat].find(
        (s) =>
          s.product_code.toLowerCase() === initialColour.trim().toLowerCase(),
      );
      if (sw) next = { ...next, [part]: toFillHex(sw.hex) };
    }
    return next;
  });

  const activeHex = partColours[activePart] ?? "#000000";

  useEffect(() => {
    queueMicrotask(() => setUrlSyncOn(true));
  }, []);

  const matchedSwatch = useMemo(() => {
    const list = swatchesByCategory[activeCategory];
    const target = normalizeHexForCompare(activeHex);
    return list.find((s) => normalizeHexForCompare(s.hex) === target);
  }, [activeCategory, activeHex, swatchesByCategory]);

  useEffect(() => {
    if (!urlSyncOn) return;

    const params = new URLSearchParams();
    params.set("category", activeCategory);
    params.set("part", activePart);
    if (matchedSwatch) {
      params.set("colour", matchedSwatch.product_code);
    }

    router.replace(`/colour-lab?${params.toString()}`, { scroll: false });
  }, [
    urlSyncOn,
    activeCategory,
    activePart,
    matchedSwatch,
    router,
  ]);

  const onCategoryChange = useCallback((id: string) => {
    const cat = id as LabCategoryKey;
    setActiveCategory(cat);
    setPartColours({ ...DEFAULT_COLOURS[cat] });
    const first = PARTS_BY_CAT[cat][0];
    setActivePart(first);
  }, []);

  const onPartClick = useCallback((part: string) => {
    setActivePart(part);
  }, []);

  const onSwatchClick = useCallback((sw: ColourSwatch) => {
    setPartColours((prev) => ({
      ...prev,
      [activePart]: toFillHex(sw.hex),
    }));
  }, [activePart]);

  const resetColours = useCallback(() => {
    setPartColours({ ...DEFAULT_COLOURS[activeCategory] });
  }, [activeCategory]);

  const tabIds: LabCategoryKey[] = ["auto", "arch", "marine", "industrial"];
  const tabs = tabIds.map((id) => ({
    id,
    label:
      id === "auto"
        ? "Automotive"
        : id === "arch"
          ? "Architectural"
          : id === "marine"
            ? "Marine"
            : "Industrial",
    count: swatchesByCategory[id].length || undefined,
  }));

  const categorySwatches = swatchesByCategory[activeCategory];
  const accent = labCategoryAccent(activeCategory);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <Tabs
          tabs={tabs}
          activeTab={activeCategory}
          onChange={onCategoryChange}
          className="mb-6"
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-white shadow-sm lg:aspect-[4/3]">
              {activeCategory === "auto" ? (
                <CarSVG
                  colours={{
                    body: partColours.body ?? DEFAULT_COLOURS.auto.body,
                    roof: partColours.roof ?? DEFAULT_COLOURS.auto.roof,
                    trim: partColours.trim ?? DEFAULT_COLOURS.auto.trim,
                    windows:
                      partColours.windows ?? DEFAULT_COLOURS.auto.windows,
                  }}
                  activePart={activePart}
                  onPartClick={onPartClick}
                />
              ) : null}
              {activeCategory === "arch" ? (
                <HouseSVG
                  colours={{
                    walls: partColours.walls ?? DEFAULT_COLOURS.arch.walls,
                    roof: partColours.roof ?? DEFAULT_COLOURS.arch.roof,
                    door: partColours.door ?? DEFAULT_COLOURS.arch.door,
                    windows:
                      partColours.windows ?? DEFAULT_COLOURS.arch.windows,
                  }}
                  activePart={activePart}
                  onPartClick={onPartClick}
                />
              ) : null}
              {activeCategory === "marine" ? (
                <ShipSVG
                  colours={{
                    hull: partColours.hull ?? DEFAULT_COLOURS.marine.hull,
                    deck: partColours.deck ?? DEFAULT_COLOURS.marine.deck,
                    superstructure:
                      partColours.superstructure ??
                      DEFAULT_COLOURS.marine.superstructure,
                    trim: partColours.trim ?? DEFAULT_COLOURS.marine.trim,
                  }}
                  activePart={activePart}
                  onPartClick={onPartClick}
                />
              ) : null}
              {activeCategory === "industrial" ? (
                <IndustrialSVG
                  colours={{
                    structure:
                      partColours.structure ??
                      DEFAULT_COLOURS.industrial.structure,
                    panels:
                      partColours.panels ?? DEFAULT_COLOURS.industrial.panels,
                    pipes:
                      partColours.pipes ?? DEFAULT_COLOURS.industrial.pipes,
                    markings:
                      partColours.markings ??
                      DEFAULT_COLOURS.industrial.markings,
                  }}
                  activePart={activePart}
                  onPartClick={onPartClick}
                />
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
              Select a part
            </p>
            <div className="flex flex-row flex-wrap gap-2">
              {PARTS_BY_CAT[activeCategory].map((partKey) => {
                const active = activePart === partKey;
                const dot = partColours[partKey] ?? "#CCC";
                return (
                  <button
                    key={partKey}
                    type="button"
                    onClick={() => onPartClick(partKey)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                      active
                        ? "border-transparent text-white shadow-md"
                        : "border-[#E0ded4] bg-white text-[#555] hover:border-[#BBB]",
                    ].join(" ")}
                    style={
                      active
                        ? { backgroundColor: accent, borderColor: accent }
                        : undefined
                    }
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: dot }}
                      aria-hidden
                    />
                    {PART_LABELS[partKey] ?? partKey}
                  </button>
                );
              })}
            </div>

            <p className="mb-2 mt-6 font-sans text-[11px] font-medium uppercase tracking-wide text-[#888]">
              Choose a colour
            </p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {categorySwatches.map((sw) => {
                const swHex = toFillHex(sw.hex);
                const active =
                  normalizeHexForCompare(swHex) ===
                  normalizeHexForCompare(activeHex);
                return (
                  <button
                    key={sw.id}
                    type="button"
                    title={sw.name}
                    onClick={() => onSwatchClick(sw)}
                    className={[
                      "h-8 w-8 rounded-lg border-2 transition duration-150 motion-reduce:transition-none",
                      active
                        ? "z-10 scale-110 shadow-md motion-reduce:scale-100"
                        : "border-transparent hover:z-10 hover:scale-105 hover:border-[#888] motion-reduce:hover:scale-100",
                    ].join(" ")}
                    style={{
                      backgroundColor: swHex,
                      borderColor: active ? accent : "transparent",
                    }}
                  />
                );
              })}
            </div>

            <div
              className="mt-4 rounded-lg border border-y border-r border-[#E8E8E4] border-l-4 bg-white p-3"
              style={{ borderLeftColor: accent }}
            >
              <div className="flex flex-row items-center gap-3">
                <span
                  className="h-7 w-7 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: activeHex }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-[13px] font-medium text-[#1a1a2e]">
                    {matchedSwatch?.name ?? "Custom mix"}
                  </p>
                  <p className="font-mono text-[11px] text-[#888]">
                    {matchedSwatch?.product_code ?? "—"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!matchedSwatch?.product_id}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 font-sans text-[13px] font-medium text-white opacity-100 transition-opacity duration-150 hover:opacity-90 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
                  style={{ backgroundColor: accent }}
                >
                  Add to cart
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={resetColours}
              className="mt-4 font-sans text-sm text-[#888] hover:text-[#333]"
            >
              Reset all parts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
