import { BlogCard } from "@/components/public/BlogCard";
import { BlogFilters } from "@/components/public/BlogFilters";
import { BlogGridSkeleton } from "@/components/public/BlogGridSkeleton";
import { PageHeader } from "@/components/public/PageHeader";
import { ScrollReveal } from "@/lib/animations/useScrollReveal";
import { getBlogPosts } from "@/lib/supabase/queries/blog";
import Link from "next/link";
import { Suspense } from "react";

type SearchProps = {
  type?: string;
};

async function BlogResults({ params }: { params: SearchProps }) {
  const typeFilter = params.type === "guide" ? ("guide" as const) : undefined;

  const { posts } = await getBlogPosts({
    type: typeFilter,
    page: 1,
    limit: 48,
  });

  if (posts.length === 0) {
    return (
      <>
        <div className="mx-auto max-w-[1280px] px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
          <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[#1a1a2e]">
            No posts yet
          </p>
          <p className="mt-3 font-sans text-[15px] text-[#666666]">Check back soon for guides and news.</p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#E8A020] px-6 py-3 font-sans text-sm font-medium text-[#1a1a2e] transition duration-150 hover:bg-[#D49215] motion-reduce:transition-none"
          >
            Browse products
          </Link>
        </div>
        <div className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          <BlogGridSkeleton />
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <ScrollReveal key={post.id} style={{ transitionDelay: `${(i % 6) * 70}ms` }}>
            <BlogCard post={post} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchProps>;
}) {
  const sp = await searchParams;

  return (
    <>
      <PageHeader
        badge="Blog & Guides"
        heading="Insights from the plant floor"
        subtext="Application notes, specifications and stories from the Chromax team — written for engineers, contractors and buyers."
      />

      <Suspense
        fallback={
          <div className="sticky top-16 z-30 h-[52px] border-b border-[#E0DED4] bg-white" />
        }
      >
        <BlogFilters />
      </Suspense>

      <section className="min-h-[40vh] bg-[#F5F0E8]">
        <Suspense
          fallback={
            <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
              <BlogGridSkeleton />
            </div>
          }
        >
          <BlogResults params={sp} />
        </Suspense>
      </section>
    </>
  );
}
