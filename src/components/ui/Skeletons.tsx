export function ClipCardSkeleton() {
  return (
    <div className="sot-card rounded overflow-hidden">
      <div className="skeleton aspect-video w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="flex gap-1">
          <div className="skeleton h-5 w-14 rounded-full" />
          <div className="skeleton h-5 w-18 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ClipGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <ClipCardSkeleton key={i} />)}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card rounded p-5">
      <div className="skeleton h-8 w-16 rounded mb-1" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}