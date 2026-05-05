import {
  ColourLab,
  type LabCategoryKey,
} from "@/components/public/ColourLab";
import { PageHeader } from "@/components/public/PageHeader";
import {
  getSwatches,
  type ColourSwatch,
} from "@/lib/supabase/queries/swatches";

export function groupSwatchesByLabCategory(
  swatches: ColourSwatch[],
): Record<LabCategoryKey, ColourSwatch[]> {
  return {
    auto: swatches.filter((s) => s.category === "automotive"),
    arch: swatches.filter((s) => s.category === "architectural"),
    marine: swatches.filter((s) => s.category === "marine"),
    industrial: swatches.filter((s) => s.category === "industrial"),
  };
}

function parseLabCategoryParam(
  raw: string | undefined,
): LabCategoryKey | undefined {
  if (!raw) return undefined;
  const r = raw.toLowerCase();
  if (r === "auto" || r === "automotive") return "auto";
  if (r === "arch" || r === "architectural") return "arch";
  if (r === "marine") return "marine";
  if (r === "industrial" || r === "custom") return "industrial";
  return undefined;
}

type SearchParams = {
  category?: string;
  colour?: string;
  part?: string;
};

export default async function ColourLabPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const allSwatches = await getSwatches();
  const swatchesByCategory = groupSwatchesByLabCategory(allSwatches);

  const initialCategory = parseLabCategoryParam(sp.category) ?? "auto";
  const initialColour = sp.colour?.trim();
  const initialPart = sp.part?.trim();

  return (
    <>
      <PageHeader
        badge="Colour Lab"
        heading="See it before you paint it"
        subtext="Choose a surface, select a colour, and visualise before you buy."
      />

      <ColourLab
        swatchesByCategory={swatchesByCategory}
        initialCategory={initialCategory}
        initialColour={initialColour}
        initialPart={initialPart}
      />
    </>
  );
}
