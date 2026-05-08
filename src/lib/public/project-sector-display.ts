import { SECTOR_HEX, type ProjectSector } from "@/lib/design/category-theme";

const KNOWN_SECTORS: ProjectSector[] = [
  "offshore",
  "construction",
  "automotive",
  "marine",
  "infrastructure",
];

export function projectSectorHex(sector: string): string {
  const s = sector.trim().toLowerCase() as ProjectSector;
  if (KNOWN_SECTORS.includes(s)) return SECTOR_HEX[s];
  return "#888888";
}

/** Large emoji for project cards (public listing + detail hero accents). */
export function projectSectorEmoji(sector: string): string {
  switch (sector.trim().toLowerCase()) {
    case "offshore":
      return "⚓";
    case "construction":
      return "🏗️";
    case "automotive":
      return "🚗";
    case "marine":
      return "🌊";
    case "infrastructure":
      return "🏛️";
    default:
      return "🔧";
  }
}

export function projectSectorLabel(sector: string): string {
  const s = sector.trim();
  if (!s) return "General";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
