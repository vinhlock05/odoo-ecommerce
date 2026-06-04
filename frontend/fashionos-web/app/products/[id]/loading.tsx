export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-3 w-48 bg-fashionos-surface animate-pulse mb-8" />
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image skeleton */}
        <div className="space-y-3">
          <div className="aspect-[3/4] bg-fashionos-surface animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-20 bg-fashionos-surface animate-pulse" />
            ))}
          </div>
        </div>
        {/* Info skeleton */}
        <div className="space-y-5 pt-2">
          <div className="h-3 w-24 bg-fashionos-surface animate-pulse" />
          <div className="h-8 w-3/4 bg-fashionos-surface animate-pulse" />
          <div className="h-6 w-28 bg-fashionos-surface animate-pulse" />
          <div className="space-y-2 pt-4">
            <div className="h-3 w-20 bg-fashionos-surface animate-pulse" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-14 bg-fashionos-surface animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-12 bg-fashionos-surface animate-pulse mt-6" />
          <div className="space-y-2 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-fashionos-surface animate-pulse" style={{ width: `${70 + i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
