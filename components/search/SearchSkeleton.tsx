"use client";

/**
 * Skeleton loader for search results
 */
export function SearchSkeleton() {
  return (
    <div className="mt-12 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-secondary rounded" />
            <div className="h-4 w-32 bg-secondary rounded" />
          </div>
        </div>
        <div className="h-4 w-28 bg-secondary rounded" />
      </div>

      {/* Card skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-card border border-border/50 p-6"
          >
            {/* Card header */}
            <div className="space-y-3 mb-5">
              <div className="h-5 w-3/4 bg-secondary rounded" />
              <div className="flex items-center gap-3">
                <div className="h-6 w-24 bg-secondary rounded-md" />
                <div className="h-4 w-20 bg-secondary rounded" />
              </div>
            </div>

            {/* Quote skeletons */}
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="pl-4 py-3">
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-secondary rounded" />
                    <div className="h-4 w-5/6 bg-secondary rounded" />
                    <div className="h-3 w-24 bg-secondary rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
