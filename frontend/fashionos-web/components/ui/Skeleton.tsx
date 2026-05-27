/**
 * Skeleton loading primitives.
 * Usage: <Skeleton className="h-4 w-32" /> or <ProductCardSkeleton />
 */

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

// ─── Base skeleton ───────────────────────────────────────────────────────────

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse bg-fashionos-border rounded-sm', className].join(' ')}
      style={style}
    />
  )
}

// ─── Product card skeleton ────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      {/* Image placeholder */}
      <Skeleton className="aspect-[3/4] w-full" />
      {/* Info */}
      <div className="pt-3 pb-4 px-4 space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 mt-1" />
      </div>
    </div>
  )
}

// ─── Product grid skeleton ────────────────────────────────────────────────────

interface ProductGridSkeletonProps {
  count?: number
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ─── Text block skeleton ──────────────────────────────────────────────────────

interface TextSkeletonProps {
  lines?: number
  className?: string
}

export function TextSkeleton({ lines = 3, className = '' }: TextSkeletonProps) {
  const widths = ['100%', '85%', '70%', '90%', '60%']
  return (
    <div className={['space-y-2', className].join(' ')}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: widths[i % widths.length] } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ─── Cart item skeleton ───────────────────────────────────────────────────────

export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 py-5 border-b border-fashionos-border" aria-hidden="true">
      <Skeleton className="w-20 h-24 flex-shrink-0" />
      <div className="flex-1 space-y-2.5 pt-1">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

import type React from 'react'
