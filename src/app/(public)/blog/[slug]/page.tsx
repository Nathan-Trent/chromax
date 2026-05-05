import { Badge } from "@/components/ui/Badge";
import { getBlogPostBySlug } from "@/lib/supabase/queries/blog";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readingMinutes(bodyHtml: string | null): number {
  const text = bodyHtml ? htmlToPlainText(bodyHtml) : "";
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return { title: "Post not found | Chromax-MCR" };
  }
  return {
    title: post.seo_title ?? `${post.title} | Chromax-MCR`,
    description:
      post.seo_description ??
      post.excerpt?.slice(0, 160) ??
      `Chromax-MCR — ${post.title}`,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const author = post.author_name?.trim() || "Chromax team";
  const dateLabel = formatPostDate(post.published_at);
  const mins = readingMinutes(post.body_html);

  return (
    <article className="mx-auto max-w-[800px] px-6 py-16">
      <Link
        href="/blog"
        className="mb-8 inline-block font-sans text-sm text-[#185FA5] hover:underline"
      >
        ← Back to blog
      </Link>

      <header>
        {post.post_type === "guide" ? (
          <div className="mb-4">
            <Badge variant="teal" size="sm">
              Guide
            </Badge>
          </div>
        ) : (
          <div className="mb-4">
            <Badge variant="blue" size="sm">
              Blog
            </Badge>
          </div>
        )}

        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight text-[#1a1a2e] mb-4">
          {post.title}
        </h1>

        <p className="mb-8 font-sans text-sm text-[#888888]">
          {author}
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <time dateTime={post.published_at ?? undefined}>{dateLabel}</time>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          {mins} min read
        </p>

        {post.cover_image_url ? (
          <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={post.cover_image_url}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 800px) 100vw, 800px"
            />
          </div>
        ) : null}
      </header>

      <div
        className="prose prose-lg max-w-none prose-headings:font-semibold
          prose-headings:text-[#1a1a2e] prose-p:text-[#444444] prose-p:leading-relaxed
          prose-a:text-[#185FA5] prose-li:text-[#444444]"
        dangerouslySetInnerHTML={{
          __html: post.body_html ?? "<p>No content yet.</p>",
        }}
      />

      <div className="mt-16 rounded-xl bg-[#F5F0E8] p-8">
        <h2 className="mb-2 font-sans text-lg font-semibold text-[#1a1a2e]">
          Explore our products
        </h2>
        <p className="mb-4 font-sans text-[14px] text-[#666666]">
          Industrial coatings manufactured in Lagos — browse the catalogue and
          technical specs.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-2 font-sans text-[13px] font-medium text-[var(--color-navy)] transition-colors duration-150 hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]"
        >
          View products
        </Link>
      </div>
    </article>
  );
}
