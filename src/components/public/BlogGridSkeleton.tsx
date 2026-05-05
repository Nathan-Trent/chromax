export function BlogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-[#E8E8E4] bg-white"
        >
          <div className="h-48 animate-pulse bg-[#E8E4DC]" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-20 animate-pulse rounded-full bg-[#E8E4DC]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#E8E4DC]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[#E8E4DC]" />
            <div className="h-12 w-full animate-pulse rounded bg-[#E8E4DC]" />
            <div className="flex justify-between pt-2">
              <div className="h-3 w-24 animate-pulse rounded bg-[#E8E4DC]" />
              <div className="h-3 w-16 animate-pulse rounded bg-[#E8E4DC]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
