import { ProductCard } from "@/components/public/ProductCard";
import { PageHeader } from "@/components/public/PageHeader";
import { ProductFilters } from "@/components/public/ProductFilters";
import { ProductGridSkeleton } from "@/components/public/ProductGridSkeleton";
import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import { getProducts } from "@/lib/supabase/queries/products";
import type { ProductCategory } from "@/lib/supabase/queries/products";
import Link from "next/link";
import { Suspense } from "react";

const PAGE_SIZE = 24;

type SearchProps = {
  category?: string;
  search?: string;
  page?: string;
};

function parseCategory(raw: string | undefined): ProductCategory | undefined {
  if (
    raw === "industrial" ||
    raw === "marine" ||
    raw === "automotive" ||
    raw === "architectural" ||
    raw === "custom"
  ) {
    return raw;
  }
  return undefined;
}

async function ProductCatalogueResults({ params }: { params: SearchProps }) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const category = parseCategory(params.category);
  const search = params.search?.trim() || undefined;

  const { products, total } = await getProducts({
    category,
    search,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    if (search) sp.set("search", search);
    if (p > 1) sp.set("page", String(p));
    const q = sp.toString();
    return q ? `/products?${q}` : "/products";
  }

  if (products.length === 0) {
    return (
      <section className="bg-[#F5F0E8] py-16">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="rounded-xl border border-[#E8E8E4] bg-white px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[#1a1a2e]">
              No products found
            </p>
            <p className="mt-3 max-w-md mx-auto font-sans text-[15px] text-[#666]">
              {category
                ? `No ${category} products match your filters.`
                : "Try adjusting your search or category filter."}
            </p>
            {category ? (
              <Link
                href="/products"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#E8A020] px-6 py-3 font-sans text-sm font-medium text-[#1a1a2e] transition duration-150 hover:bg-[#D49215] motion-reduce:transition-none"
              >
                View all products
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#F5F0E8] py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <ScrollReveal
              key={p.id}
              style={{ transitionDelay: `${Math.min(i, 11) * 70}ms` }}
            >
              <ProductCard product={p} />
            </ScrollReveal>
          ))}
        </div>
        {totalPages > 1 ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {page > 1 ? (
              <Link
                href={hrefForPage(page - 1)}
                className="font-sans text-sm font-medium transition duration-150 hover:underline motion-reduce:transition-none"
                style={{ color: "#185FA5" }}
              >
                ← Previous
              </Link>
            ) : null}
            <span className="font-sans text-sm text-[#666]">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={hrefForPage(page + 1)}
                className="font-sans text-sm font-medium transition duration-150 hover:underline motion-reduce:transition-none"
                style={{ color: "#185FA5" }}
              >
                Next →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchProps>;
}) {
  const sp = await searchParams;

  return (
    <>
      <PageHeader
        badge="Our Products"
        heading="Coatings for every application"
        subtext="Industrial, marine, automotive and architectural coatings — formulated and manufactured in Lagos."
      />

      <Suspense
        fallback={
          <div className="sticky top-16 z-40 h-[52px] border-b border-[#E0DED4] bg-white" />
        }
      >
        <ProductFilters />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductCatalogueResults params={sp} />
      </Suspense>
    </>
  );
}
