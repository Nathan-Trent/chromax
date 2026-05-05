import { Badge } from "@/components/ui/Badge";
import {
  CATEGORY_HEX,
} from "@/lib/design/category-theme";
import type { Product, ProductCategory } from "@/lib/supabase/queries/products";
import Image from "next/image";
import Link from "next/link";

const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  industrial: "⚙️",
  marine: "⚓",
  automotive: "🚗",
  architectural: "🏠",
  custom: "🧪",
};

export function categoryLabel(cat: ProductCategory) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function primaryImageMeta(product: Product) {
  const { images } = product;
  if (!images?.length) return { url: null as string | null, alt: product.name };
  const primary = images.find((img) => img.is_primary);
  const img = primary ?? images[0];
  return { url: img?.url ?? null, alt: img?.alt ?? product.name };
}

export function ProductStockBadge({
  stock,
  lowThreshold,
}: {
  stock: number;
  lowThreshold: number;
}) {
  if (stock <= 0) {
    return <Badge variant="coral">Out of stock</Badge>;
  }
  if (stock <= lowThreshold) {
    return <Badge variant="amber">Low stock</Badge>;
  }
  return <Badge variant="teal">In stock</Badge>;
}

export function formatNgn(price: number | null) {
  if (price === null || Number.isNaN(Number(price))) return null;
  return `₦${Number(price).toLocaleString("en-NG")}`;
}

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { url: imgUrl, alt: imgAlt } = primaryImageMeta(product);
  const priceLabel = formatNgn(product.price_ngn);
  const accent = CATEGORY_HEX[product.category];

  return (
    <Link
      href={`/products/${product.slug}`}
      data-product-card
      data-cat={product.category}
      style={{ borderTopColor: accent }}
      className="group motion-reduce:hover:transform-none block overflow-hidden rounded-xl border border-[#E8E8E4] border-t-4 bg-white motion-reduce:hover:shadow-none"
    >
      <div className="relative h-40 bg-[#F5F0E8] sm:h-52">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={imgAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-6xl"
            style={{ color: `${accent}99` }}
            aria-hidden
          >
            {CATEGORY_EMOJI[product.category]}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <ProductStockBadge
            stock={product.stock}
            lowThreshold={product.low_threshold}
          />
        </div>
      </div>
      <div className="p-5">
        <p
          className="mb-1 font-sans text-sm font-medium uppercase tracking-wide sm:text-[10px]"
          style={{ color: accent }}
        >
          {categoryLabel(product.category)}
        </p>
        <h2 className="font-[family-name:var(--font-fraunces)] mb-2 line-clamp-2 text-base font-semibold text-[#1a1a2e]">
          {product.name}
        </h2>
        <p className="mb-4 line-clamp-2 font-sans text-[13px] text-[#666]">
          {product.short_desc ?? ""}
        </p>
        <div className="flex items-center justify-between gap-3">
          {priceLabel ? (
            <span className="font-sans text-lg font-semibold text-[#1a1a2e]">
              {priceLabel}
            </span>
          ) : (
            <span className="font-sans text-sm text-[#888]">Request quote</span>
          )}
          <span
            className="shrink-0 font-sans text-lg font-medium transition duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
            style={{ color: accent }}
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
