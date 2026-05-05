import type { BlogPost } from "@/lib/supabase/queries/blog";
import Image from "next/image";
import Link from "next/link";

function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function readingMinutes(post: BlogPost): number {
  const base = (post.excerpt?.length ?? 0) + (post.title?.length ?? 0);
  return Math.max(1, Math.ceil(base / 800));
}

export interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const cover = post.cover_image_url;
  const author = post.author_name?.trim() || "Chromax team";
  const isGuide = post.post_type === "guide";
  const accent = isGuide ? "#0F6E56" : "#185FA5";
  const gradient = isGuide
    ? "linear-gradient(145deg, #0F6E56, #185a48)"
    : "linear-gradient(145deg, #185FA5, #0f4d8c)";
  const label = isGuide ? "Guide" : "Blog";

  const mins = readingMinutes(post);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#E8E8E4] border-t-4 bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-2 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ borderTopColor: accent }}
    >
      <div className="relative h-48 w-full overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition duration-200 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center"
            style={{ background: gradient }}
          >
            <span
              className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-white/25"
              aria-hidden
            >
              {label}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span
          className="inline-flex w-fit items-center justify-center rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          {label}
        </span>
        <h2 className="font-[family-name:var(--font-fraunces)] mt-3 mb-2 line-clamp-2 text-lg font-semibold text-[#1a1a2e]">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mb-4 line-clamp-3 font-sans text-[13px] text-[#666666]">{post.excerpt}</p>
        ) : (
          <p className="mb-4 line-clamp-3 font-sans text-[13px] text-[#666666]">
            Read more on Chromax-MCR.
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EBE0] pt-3 font-sans text-xs text-[#888888]">
          <span>{author}</span>
          <span className="flex items-center gap-2">
            <time dateTime={post.published_at ?? undefined}>{formatPostDate(post.published_at)}</time>
            <span aria-hidden>·</span>
            <span>{mins} min read</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
