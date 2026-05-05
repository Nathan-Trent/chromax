"use client";

import { AddToCartButton } from "@/components/public/AddToCartButton";
import { CATEGORY_HEX } from "@/lib/design/category-theme";
import type { Product } from "@/lib/supabase/queries/products";
import type { ColourSwatch } from "@/lib/supabase/queries/swatches";
import Link from "next/link";
import { useState } from "react";

export interface ProductDetailCartSectionProps {
  product: Product;
  linkedSwatches: ColourSwatch[];
  inStock: boolean;
}

export function ProductDetailCartSection({
  product,
  linkedSwatches,
  inStock,
}: ProductDetailCartSectionProps) {
  const mustChooseColour =
    product.requires_colour_selection && linkedSwatches.length > 0;

  const [selectedCode, setSelectedCode] = useState<string | undefined>(() =>
    mustChooseColour ? undefined : linkedSwatches[0]?.product_code,
  );

  const labCategory =
    product.category === "custom" ? "industrial" : product.category;

  const catHex = CATEGORY_HEX[product.category];

  return (
    <>
      {linkedSwatches.length > 0 ? (
        <div className="mb-2">
          {product.requires_colour_selection && linkedSwatches.length > 0 ? (
            <p className="mb-2 font-sans text-xs text-[#BA7517]">
              * Colour selection required before adding to cart
            </p>
          ) : null}
          <p className="mb-2 font-sans text-[13px] font-medium text-[#333333]">
            Select a colour
          </p>
          <div className="flex flex-wrap gap-2">
            {linkedSwatches.map((sw) => {
              const active = selectedCode === sw.product_code;
              return (
                <button
                  key={sw.id}
                  type="button"
                  title={`${sw.name} (${sw.product_code})`}
                  onClick={() => setSelectedCode(sw.product_code)}
                  className={`shrink-0 rounded-full transition duration-150 motion-reduce:transition-none ${
                    active
                      ? "h-9 w-9 scale-110 shadow-md motion-reduce:scale-100"
                      : "h-8 w-8 hover:scale-105 motion-reduce:hover:scale-100"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: `#${sw.hex}`,
                          borderWidth: 3,
                          borderStyle: "solid",
                          borderColor: catHex,
                        }
                      : { backgroundColor: `#${sw.hex}`, borderWidth: 2, borderStyle: "solid", borderColor: "transparent" }
                  }
                />
              );
            })}
          </div>
          <Link
            href={`/colour-lab?category=${encodeURIComponent(labCategory)}&colour=${encodeURIComponent(selectedCode ?? linkedSwatches[0]?.product_code ?? "")}`}
            className="mt-2 inline-block font-sans text-sm font-medium transition duration-150 hover:opacity-80 motion-reduce:transition-none"
            style={{ color: catHex }}
          >
            Visualise this colour →
          </Link>
        </div>
      ) : null}

      <div className="mt-4">
        <AddToCartButton
          product={product}
          requiresColour={
            product.requires_colour_selection && linkedSwatches.length > 0
          }
          selectedVariant={selectedCode}
          disabled={!inStock}
        />
      </div>
    </>
  );
}
