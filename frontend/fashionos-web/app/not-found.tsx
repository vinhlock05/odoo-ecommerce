import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
}

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p
        className="text-[9rem] font-bold leading-none tracking-tighter text-fashionos-border select-none"
        aria-hidden="true"
      >
        404
      </p>
      <h1
        className="text-2xl font-semibold mt-4 mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Trang không tồn tại
      </h1>
      <p className="text-fashionos-muted text-sm mb-8 max-w-sm">
        Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa.
        Hãy thử tìm kiếm sản phẩm hoặc về trang chủ.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="bg-fashionos-black text-fashionos-white px-6 py-2.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors"
        >
          Về trang chủ
        </Link>
        <Link
          href="/products"
          className="border border-fashionos-border px-6 py-2.5 text-xs tracking-widest uppercase font-medium hover:border-fashionos-black transition-colors"
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  )
}
