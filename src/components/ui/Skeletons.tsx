// ── Generic skeleton pulse blocks ────────────────────────────────────────────

export function ClipCardSkeleton() {
  return (
    <div className="sot-card rounded overflow-hidden">
      <div className="skeleton aspect-video w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3.5 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="flex gap-1.5 mt-1">
          <div className="skeleton h-5 w-14 rounded-sm" />
          <div className="skeleton h-5 w-20 rounded-sm" />
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
    <div className="sot-card rounded p-5">
      <div className="skeleton h-8 w-16 rounded mb-2" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}

/** Compact card used in the /streamers grid */
export function StreamerCardSkeleton() {
  return (
    <div className="sot-card rounded-lg p-4 text-center">
      <div className="skeleton w-14 h-14 rounded-full mx-auto mb-3" />
      <div className="skeleton h-3.5 rounded w-3/4 mx-auto mb-1.5" />
      <div className="skeleton h-2.5 rounded w-1/2 mx-auto mb-3" />
      <div className="skeleton h-5 rounded-sm w-16 mx-auto" />
    </div>
  );
}

/** Full grid skeleton for /streamers */
export function StreamerGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => <StreamerCardSkeleton key={i} />)}
    </div>
  );
}

/** Inline card used in the clip picker modal */
export function PickerCardSkeleton() {
  return (
    <div className="rounded overflow-hidden border border-white/5 bg-white/3">
      <div className="skeleton aspect-video w-full" />
      <div className="p-2 space-y-1.5">
        <div className="skeleton h-3 rounded w-4/5" />
        <div className="skeleton h-2.5 rounded w-1/2" />
      </div>
    </div>
  );
}

/** Submit page auth-loading skeleton */
export function SubmitPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
      <div className="mb-10 space-y-2">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-px w-32 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
        <div className="space-y-6">
          <div className="skeleton rounded-lg h-40 w-full" />
          <div className="skeleton rounded-lg aspect-video w-full" />
          <div className="skeleton rounded h-14 w-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="skeleton h-6 w-16 rounded-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
