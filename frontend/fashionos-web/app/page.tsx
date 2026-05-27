import Link from 'next/link'
import { getProducts, type Product } from '@/lib/api'
import ProductCard from '@/components/ProductCard'

// ─── Homepage ────────────────────────────────────────────────────────────────

export default async function Home() {
  const res = await getProducts({ limit: 8 }).catch(() => null)
  const products = res?.success ? res.data : []

  return (
    <main>
      <HeroSection />
      <SocialProofBar />
      <CategoryBento />
      <FeaturedSection products={products} />
      <CoolClubTeaser />
    </main>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-[var(--hero-height)] bg-fashionos-black text-fashionos-white flex items-center overflow-hidden grain">
      {/* Dot-grid texture */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* Gold radial glow */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 70%)' }}
      />

      <div className="section-wrap relative z-10 w-full py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left — copy */}
          <div className="space-y-8 animate-fade-up">
            <p className="eyebrow text-fashionos-accent tracking-[0.35em]">
              Bộ sưu tập 2026
            </p>

            <h1
              className="text-hero leading-[1.03] tracking-[-0.03em] font-bold uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Mặc Đẹp.
              <br />

              <span className="block text-fashionos-accent my-8">
                Sống Mạnh.
              </span>

              Thuần Việt.
            </h1>

            <p className="text-fashionos-muted text-base max-w-md leading-relaxed">
              Thời trang thể thao chất lượng cao — miễn phí vận chuyển từ{' '}
              <span className="text-fashionos-white font-semibold">500.000₫</span>.
              Đổi trả miễn phí trong 30 ngày.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/products"
                className="btn-primary"
              >
                Khám phá ngay
              </Link>
              <Link
                href="/products?sort_by=newest"
                className="btn-ghost flex items-center gap-2 text-fashionos-white hover:text-fashionos-accent"
              >
                Hàng mới về
                <ArrowRightIcon />
              </Link>
            </div>

            {/* Trust metrics */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-fashionos-white/10">
              {[
                { value: '500K+', label: 'Khách hàng' },
                { value: '4.9★', label: 'Đánh giá TB' },
                { value: '30 ngày', label: 'Đổi trả miễn phí' },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-lg font-bold text-fashionos-white">{m.value}</p>
                  <p className="text-[10px] tracking-widest uppercase text-fashionos-muted">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero image */}
          <div
            className="relative hidden lg:block animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            {/* Gold corner accents */}
            <div className="absolute -top-3 -left-3 w-12 h-12 border-t-2 border-l-2 border-fashionos-accent z-10" />
            <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-2 border-r-2 border-fashionos-accent z-10" />

            <div className="aspect-[3/4] w-full max-w-sm mx-auto bg-fashionos-surface overflow-hidden">
              <img
                src="https://placehold.co/480x640/1A1A1A/C8A96E?text=FashionOS+2026"
                alt="FashionOS Bộ sưu tập 2026"
                className="w-full h-full object-cover"
                fetchPriority="high"
              />
            </div>

            {/* Floating badge */}
            <div className="absolute bottom-8 -left-6 bg-fashionos-accent text-fashionos-black px-4 py-2 shadow-xl">
              <p className="text-[10px] tracking-widest uppercase font-semibold">Mới nhất</p>
              <p className="text-sm font-bold">SS 2026</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Social proof bar ────────────────────────────────────────────────────────

const PROOF_ITEMS = [
  'Free ship từ 500.000₫',
  'CoolCash hoàn tiền tới 12%',
  'Đổi trả miễn phí 30 ngày',
  'Vải chất lượng cao — kiểm định từng lô',
  '500.000+ khách hàng tin dùng',
  'Giao hàng nhanh toàn quốc',
  'CoolClub — loyalty cao cấp',
  'Bảo hành 1 năm form dáng',
]

function SocialProofBar() {
  const doubled = [...PROOF_ITEMS, ...PROOF_ITEMS]
  return (
    <div className="bg-fashionos-black border-y border-fashionos-white/10 py-3 overflow-hidden">
      <div className="flex marquee-track animate-marquee whitespace-nowrap gap-0">
        {doubled.map((item, i) => (
          <span key={i} className="text-white inline-flex items-center gap-3 px-6 text-[11px] tracking-widest uppercase text-fashionos-muted">
            <span className="text-fashionos-accent">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Category bento ──────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    slug: 'nam',
    label: 'Nam',
    sub: 'Áo thun · Quần short · Áo hoodie',
    gradient: 'from-[#0F1F3D] to-[#1A3366]',
    size: 'lg:col-span-2 lg:row-span-2',
    href: '/products?gender=male',
  },
  {
    slug: 'nu',
    label: 'Nữ',
    sub: 'Crop top · Leggings · Váy thể thao',
    gradient: 'from-[#2D1B4E] to-[#4A2080]',
    size: '',
    href: '/products?gender=female',
  },
  {
    slug: 'unisex',
    label: 'Unisex',
    sub: 'Phong cách cho mọi người',
    gradient: 'from-[#0D3325] to-[#155E3B]',
    size: '',
    href: '/products?gender=unisex',
  },
  {
    slug: 'sale',
    label: 'Sale %',
    sub: 'Giảm đến 50% — giới hạn số lượng',
    gradient: 'from-[#3D0F0F] to-[#661A1A]',
    size: '',
    href: '/products?tag=sale',
  },
]

function CategoryBento() {
  return (
    <section className="section-wrap py-16 lg:py-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">Danh mục</p>
          <h2
            className="text-display font-bold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Mua theo phong cách
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden sm:flex items-center gap-2 text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors"
        >
          Tất cả <ArrowRightIcon />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-3 h-[480px] lg:h-[520px]">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            className={[
              'relative group overflow-hidden bg-fashionos-black',
              cat.size,
            ].join(' ')}
          >
            <div className={['absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity group-hover:opacity-75', cat.gradient].join(' ')} />
            <div className="relative z-10 h-full flex flex-col justify-end p-5 lg:p-7">
              <p className="eyebrow text-fashionos-white/50 mb-1">Danh mục</p>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">{cat.label}</h3>
              <p className="text-[11px] text-fashionos-white/60 leading-relaxed hidden sm:block">{cat.sub}</p>
              <div className="mt-3 flex items-center gap-2 text-fashionos-accent text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Khám phá <ArrowRightIcon size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ─── Featured products ────────────────────────────────────────────────────────

function FeaturedSection({ products }: { products: Product[] }) {
  return (
    <section className="bg-fashionos-surface py-16 lg:py-20">
      <div className="section-wrap">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow mb-2">Mới nhất</p>
            <h2
              className="text-display font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Hàng mới về
            </h2>
          </div>
          <Link
            href="/products?sort_by=newest"
            className="hidden sm:flex items-center gap-2 text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors"
          >
            Xem tất cả <ArrowRightIcon />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-fashionos-muted">
            <p className="text-lg">Đang tải sản phẩm...</p>
          </div>
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/products"
            className="btn-outline"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── CoolClub teaser ──────────────────────────────────────────────────────────

const TIERS = [
  { id: 'bronze', label: 'Bronze', pct: '7%', min: '0₫', color: '#CD7F32', bg: 'rgba(205,127,50,0.12)' },
  { id: 'silver', label: 'Silver', pct: '8%', min: '3.000.000₫', color: '#A8A9AD', bg: 'rgba(168,169,173,0.12)' },
  { id: 'gold', label: 'Gold', pct: '10%', min: '10.000.000₫', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
  { id: 'diamond', label: 'Diamond', pct: '12%', min: '30.000.000₫', color: '#B9F2FF', bg: 'rgba(185,242,255,0.12)' },
]

function CoolClubTeaser() {
  return (
    <section className="relative bg-fashionos-black text-fashionos-white py-20 lg:py-28 overflow-hidden grain">
      {/* Gold radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(200,169,110,0.15) 0%, transparent 70%)' }}
      />

      <div className="section-wrap relative z-10">
        <div className="text-center mb-12">
          <p className="eyebrow text-fashionos-accent tracking-[0.35em] mb-3">Chương trình khách hàng thân thiết</p>
          <h2
            className="text-display font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            CoolCash &amp; CoolClub
          </h2>
          <p className="text-fashionos-muted max-w-lg mx-auto leading-relaxed">
            Mỗi đơn hàng tích luỹ CoolCash — dùng như tiền mặt cho lần mua kế tiếp.
            Lên hạng, hoàn tiền nhiều hơn.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-12">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className="border border-fashionos-white/10 p-5 lg:p-6 flex flex-col gap-3 hover:border-fashionos-accent/30 transition-colors"
              style={{ background: tier.bg }}
            >
              <p
                className="text-[10px] tracking-[0.2em] uppercase font-semibold"
                style={{ color: tier.color }}
              >
                {tier.label}
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: tier.color }}
              >
                {tier.pct}
              </p>
              <p className="text-[11px] text-fashionos-muted leading-relaxed">
                CoolCash mỗi đơn
              </p>
              <div className="mt-auto pt-3 border-t border-fashionos-white/10">
                <p className="text-[10px] text-fashionos-muted">Từ {tier.min}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="btn-primary">
            Đăng ký miễn phí
          </Link>
          <Link
            href="/coolclub"
            className="btn-ghost text-fashionos-white hover:text-fashionos-accent flex items-center gap-2"
          >
            Tìm hiểu thêm <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
