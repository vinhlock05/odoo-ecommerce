import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FashionOS',
    template: '%s | FashionOS',
  },
  description: 'Headless eCommerce Platform for Fashion Brands — Powered by Odoo v19',
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
      </body>
    </html>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-fashionos-white border-b border-fashionos-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-semibold tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Fashion
            </span>
            <span className="text-xl font-light tracking-[0.2em] uppercase text-fashionos-accent">
              OS
            </span>
          </a>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/products" className="text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors">
              Sản phẩm
            </a>
            <a href="#" className="text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors">
              Bộ sưu tập
            </a>
            <a href="#" className="text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors">
              Sale
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button aria-label="Search" className="p-2 hover:text-fashionos-accent transition-colors">
              <SearchIcon />
            </button>
            <button aria-label="Account" className="p-2 hover:text-fashionos-accent transition-colors">
              <UserIcon />
            </button>
            <button aria-label="Cart" className="p-2 hover:text-fashionos-accent transition-colors relative">
              <CartIcon />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-fashionos-black text-fashionos-white text-[10px] rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
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
            <p>Backend: <span className="text-gray-300">Odoo v19 + OCA FastAPI</span></p>
            <p>Frontend: <span className="text-gray-300">Next.js 15 App Router</span></p>
            <p className="mt-4 text-xs">MVP v0.1 — FashionOS 2026</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
