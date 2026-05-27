'use client'

import { useState } from 'react'
import { imageUrl } from '@/lib/api'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [active, setActive] = useState(0)

  const mainSrc =
    images.length > 0
      ? imageUrl(images[active])
      : `https://placehold.co/600x800/F4F4F4/9CA3AF?text=${encodeURIComponent(productName.slice(0, 14))}`

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] bg-fashionos-surface overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={active}
          src={mainSrc}
          alt={productName}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = `https://placehold.co/600x800/F4F4F4/9CA3AF?text=${encodeURIComponent(
              productName.slice(0, 14),
            )}`
          }}
        />

        {/* Prev / Next arrows — only when multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Ảnh tiếp"
              onClick={() => setActive((a) => (a + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Counter */}
            <span className="absolute bottom-3 right-3 text-[10px] text-white bg-black/50 px-2 py-0.5 tracking-widest">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ảnh ${i + 1}`}
              className={[
                'w-16 h-20 flex-shrink-0 overflow-hidden border-2 transition-all duration-150',
                i === active
                  ? 'border-fashionos-black'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-fashionos-border',
              ].join(' ')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(img)}
                alt={`${productName} ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = `https://placehold.co/64x80/F4F4F4/9CA3AF?text=...`
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
