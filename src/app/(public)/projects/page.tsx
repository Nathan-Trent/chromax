import { PageHeader } from "@/components/public/PageHeader";
import {
  ProjectFilters,
  type ProjectListItem,
} from "@/components/public/ProjectFilters";

const PROJECTS: ProjectListItem[] = [
  {
    id: "1",
    title: "Lagos Port Authority Berth Protection",
    sector: "offshore",
    location: "Lagos, Nigeria",
    description:
      "Anti-corrosion coating system for steel berth structures in saltwater environment. 12,000 m² surface area.",
  },
  {
    id: "2",
    title: "Eko Atlantic Tower Exterior",
    sector: "construction",
    location: "Lagos, Nigeria",
    description:
      "Architectural coating system for luxury high-rise exterior. Weather-resistant topcoat with 15-year guarantee.",
  },
  {
    id: "3",
    title: "Fleet Refinish — Dangote Transport",
    sector: "automotive",
    location: "Lagos, Nigeria",
    description:
      "Full fleet refinish for 40-vehicle logistics fleet. Colour-matched corporate livery in ChromaGloss 2K.",
  },
  {
    id: "4",
    title: "MV Excellence Hull Treatment",
    sector: "marine",
    location: "Apapa, Lagos",
    description:
      "Anti-fouling and hull protection system for commercial cargo vessel. Applied during scheduled dry-dock.",
  },
  {
    id: "5",
    title: "Lekki-Epe Expressway Infrastructure",
    sector: "infrastructure",
    location: "Lagos, Nigeria",
    description:
      "Bridge structure and barrier coating for 14km highway infrastructure project. Zinc-rich primer system.",
  },
  {
    id: "6",
    title: "Warri Refinery Maintenance Coating",
    sector: "offshore",
    location: "Warri, Nigeria",
    description:
      "Maintenance coating programme for refinery process equipment and structural steelwork.",
  },
];

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        variant="charcoal"
        badge="Projects"
        heading="Built to last in the real world"
        subtext="Case studies across offshore, marine, construction, automotive and infrastructure — specified and applied across Nigeria."
      />
      <ProjectFilters projects={PROJECTS} />
    </>
  );
}
