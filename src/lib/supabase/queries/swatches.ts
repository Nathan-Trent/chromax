import { createClient } from "@/lib/supabase/server";

export type ColourSwatchCategory =
  | "automotive"
  | "marine"
  | "architectural"
  | "industrial";

export type ColourSwatch = {
  id: string;
  name: string;
  hex: string;
  product_code: string;
  category: ColourSwatchCategory;
  product_id: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getSwatches(category?: string): Promise<ColourSwatch[]> {
  const supabase = await createClient();

  let query = supabase
    .from("colour_swatches")
    .select(
      "id,name,hex,product_code,category,product_id,display_order,active,created_at,updated_at",
    )
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`getSwatches failed: ${error.message}`);
  }

  return (data ?? []) as ColourSwatch[];
}
