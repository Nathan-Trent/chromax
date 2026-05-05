import type { ProductCategory } from "@/lib/supabase/queries/products";

/** Product / homepage category accents (matches globals.css tokens). */
export const CATEGORY_HEX: Record<ProductCategory, string> = {
  industrial: "#185FA5",
  marine: "#0F6E56",
  automotive: "#993C1D",
  architectural: "#BA7517",
  custom: "#534AB7",
};

/** Projects listing sectors → brand colours */
export type ProjectSector =
  | "offshore"
  | "construction"
  | "automotive"
  | "marine"
  | "infrastructure";

export const SECTOR_HEX: Record<ProjectSector, string> = {
  offshore: "#185FA5",
  construction: "#BA7517",
  automotive: "#993C1D",
  marine: "#0F6E56",
  infrastructure: "#534AB7",
};

export type LabCategoryAccentKey = "auto" | "arch" | "marine" | "industrial";

export function labCategoryAccent(key: LabCategoryAccentKey): string {
  switch (key) {
    case "auto":
      return CATEGORY_HEX.automotive;
    case "arch":
      return CATEGORY_HEX.architectural;
    case "marine":
      return CATEGORY_HEX.marine;
    case "industrial":
      return CATEGORY_HEX.industrial;
    default:
      return CATEGORY_HEX.industrial;
  }
}
