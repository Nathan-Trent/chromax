import { FeaturedProductsGrid } from "@/components/public/home/FeaturedProductsGrid";
import type { HomepageContent } from "@/lib/content/homepage";
import type { Product } from "@/lib/supabase/queries/products";
import Link from "next/link";

export type FeaturedProductsSectionProps = {
  content: Pick<HomepageContent, "products_label" | "products_heading" | "products_subtext">;
  products: Product[];
};

export function FeaturedProductsSection({ content, products }: FeaturedProductsSectionProps) {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888888]">
              {content.products_label}
            </p>
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[#1a1a2e] md:text-4xl">
              {content.products_heading}
            </h2>
            <p className="mt-3 font-sans text-[15px] text-[#555555]">{content.products_subtext}</p>
          </div>
          <Link
            href="/products"
            className="shrink-0 font-sans text-sm font-medium text-[#185FA5] transition hover:text-[#134a84] motion-reduce:transition-none"
          >
            View all products →
          </Link>
        </div>
        <FeaturedProductsGrid products={products} />
      </div>
    </section>
  );
}
