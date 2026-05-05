"use client";

import { primaryImageMeta } from "@/components/public/ProductCard";
import { CATEGORY_HEX } from "@/lib/design/category-theme";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/lib/supabase/queries/products";
import { useState } from "react";

export type AddToCartProduct = Pick<
  Product,
  "id" | "name" | "slug" | "price_ngn" | "price_usd" | "price_gbp" | "images" | "category"
>;

export interface AddToCartButtonProps {
  product: AddToCartProduct;
  requiresColour?: boolean;
  selectedVariant?: string;
  disabled?: boolean;
}

export function AddToCartButton({
  product,
  requiresColour = false,
  selectedVariant,
  disabled = false,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [showAdded, setShowAdded] = useState(false);

  const colourBlocked =
    requiresColour && !(selectedVariant?.trim() ?? "");

  const buttonDisabled = disabled || colourBlocked;

  const accent = CATEGORY_HEX[product.category];

  function handleClick() {
    if (buttonDisabled) return;
    const { url } = primaryImageMeta(product as Product);
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_ngn: product.price_ngn,
      price_usd: product.price_usd,
      price_gbp: product.price_gbp,
      variant: selectedVariant,
      image_url: url ?? undefined,
      category: product.category,
    });
    setShowAdded(true);
    window.setTimeout(() => setShowAdded(false), 1500);
  }

  const buttonLabel = colourBlocked
    ? "Select a colour first"
    : showAdded
      ? "Added!"
      : "Add to cart";

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={buttonDisabled}
        onClick={handleClick}
        style={{ backgroundColor: accent }}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-sans text-sm font-medium text-white opacity-100 transition-opacity duration-150 ease-in-out hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a2e] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none sm:text-[13px]"
      >
        {buttonLabel}
      </button>
      {colourBlocked ? (
        <p className="mt-2 flex items-center gap-1 font-sans text-xs text-[#BA7517]">
          <span aria-hidden>⚠</span>
          <span>This product requires a colour selection</span>
        </p>
      ) : null}
    </div>
  );
}
