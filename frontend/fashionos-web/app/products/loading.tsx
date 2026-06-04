export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header skeleton */}
      <div className="h-8 w-40 bg-fashionos-surface animate-pulse mb-8" />
      <div className="flex gap-6">
        {/* Filters sidebar skeleton */}
        <div className="hidden lg:block w-56 flex-shrink-0 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-fashionos-surface animate-pulse" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-3 w-32 bg-fashionos-surface animate-pulse" />
              ))}
            </div>
          ))}
        </div>
        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-fashionos-surface animate-pulse" />
              <div className="h-3 w-3/4 bg-fashionos-surface animate-pulse" />
              <div className="h-3 w-1/2 bg-fashionos-surface animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
