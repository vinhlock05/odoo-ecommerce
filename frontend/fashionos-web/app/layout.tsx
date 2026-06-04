import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Toaster from '@/components/Toast'
import CartDrawer from '@/components/CartDrawer'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fashionos.vn'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'FashionOS — Thời Trang Thể Thao Việt Nam',
    template: '%s | FashionOS',
  },
  description:
    'Thời trang thể thao chất lượng cao thuần Việt — free ship từ 500k, đổi trả 30 ngày, tích CoolCash mỗi đơn. Coolmate, Gymbody alternative.',
  keywords: ['thời trang thể thao', 'áo thun', 'quần short', 'coolmate', 'gymwear', 'vietnam fashion'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: 'FashionOS',
    title: 'FashionOS — Thời Trang Thể Thao Việt Nam',
    description: 'Thời trang thể thao chất lượng cao thuần Việt — free ship, đổi trả 30 ngày, tích CoolCash.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'FashionOS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FashionOS — Thời Trang Thể Thao Việt Nam',
    description: 'Thời trang thể thao chất lượng cao — free ship, đổi trả 30 ngày.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Toaster />
        <CartDrawer />
      </body>
    </html>
  )
}

function Footer() {
  return (
    <footer className="bg-fashionos-black text-fashionos-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-lg font-semibold tracking-[0.2em] uppercase mb-2">
              Fashion<span className="text-fashionos-accent">OS</span>
            </p>
            <p className="text-sm text-gray-400 max-w-xs">
              Headless eCommerce template dành cho thương hiệu thời trang Việt Nam.
              Powered by Odoo v19 + Next.js 15.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Backend: <span className="text-gray-300">Odoo v19 + REST API</span></p>
            <p>Frontend: <span className="text-gray-300">Next.js 16 App Router</span></p>
            <p className="mt-4 text-xs">MVP v0.1 — FashionOS 2026</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
