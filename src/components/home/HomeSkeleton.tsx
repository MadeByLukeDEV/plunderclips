// src/components/home/HomeSkeleton.tsx
export function HeroSkeleton() {
  return (
    <div className="relative border-b border-white/5 overflow-hidden min-h-[480px] md:min-h-[600px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-20 w-full rounded" />
            <div className="skeleton h-1 w-32 rounded" />
            <div className="skeleton h-5 w-72 rounded" />
            <div className="skeleton h-5 w-56 rounded" />
            <div className="skeleton h-12 w-36 rounded mt-4" />
          </div>
          <div className="skeleton rounded-lg" style={{ paddingBottom: '56.25%' }} />
        </div>
      </div>
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="skeleton h-7 w-40 rounded" />
        <div className="flex-1 skeleton h-px" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <div className="sot-card rounded overflow-hidden">
              <div className="skeleton w-full" style={{ paddingBottom: '56.25%' }} />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RisingCreatorsSkeleton() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="skeleton h-7 w-44 rounded" />
        <div className="flex-1 skeleton h-px" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sot-card rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-3 w-6 rounded" />
              <div className="skeleton h-5 w-24 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="skeleton h-3 w-40 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}