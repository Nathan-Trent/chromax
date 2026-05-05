export function ProductGridSkeleton() {
  return (
    <section className="bg-[#F5F0E8] py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-[#E8E8E4] bg-white"
            >
              <div className="h-52 animate-pulse bg-[#E8E4DC]" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-[#E8E4DC]" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-[#E8E4DC]" />
                <div className="h-3 w-full animate-pulse rounded bg-[#E8E4DC]" />
                <div className="flex justify-between pt-2">
                  <div className="h-5 w-24 animate-pulse rounded bg-[#E8E4DC]" />
                  <div className="h-4 w-12 animate-pulse rounded bg-[#E8E4DC]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
