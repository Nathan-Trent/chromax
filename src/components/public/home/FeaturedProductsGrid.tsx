"use client";

import { ProductCard } from "@/components/public/ProductCard";
import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import type { Product } from "@/lib/supabase/queries/products";

export function FeaturedProductsGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[340px] animate-pulse rounded-xl border border-[#E8E8E4] bg-[#F5F0E8]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p, i) => (
        <ScrollReveal key={p.id} style={{ transitionDelay: `${i * 80}ms` }}>
          <ProductCard product={p} />
        </ScrollReveal>
      ))}
    </div>
  );
}
