'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { isLoggedIn } from '@/lib/auth'

// ─── Static data ──────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'member',
    name: 'Thành Viên',
    subtitle: 'Member',
    threshold: 'Từ 0₫',
    accentColor: 'var(--tw-color-fashionos-muted, #9CA3AF)',
    borderClass: 'border-fashionos-border',
    headerClass: 'bg-fashionos-surface',
    badge: null,
    perks: [
      'Tích 1% CoolCash mỗi đơn hàng',
      'Miễn phí vận chuyển từ 500.000₫',
      'Sinh nhật +200₫ CoolCash',
      'Đổi trả trong 30 ngày',
    ],
  },
  {
    id: 'silver',
    name: 'Bạch Kim',
    subtitle: 'Silver',
    threshold: 'Chi tiêu ≥ 3.000.000₫/năm',
    accentColor: '#B8C4CC',
    borderClass: 'border-[#B8C4CC]',
    headerClass: 'bg-gradient-to-br from-[#B8C4CC]/20 to-[#8FA3AE]/10',
    badge: 'Phổ biến',
    perks: [
      'Tích 2% CoolCash mỗi đơn hàng',
      'Miễn phí vận chuyển mọi đơn hàng',
      'Sinh nhật +500₫ CoolCash',
      'Ưu tiên hỗ trợ khách hàng',
      'Early access sale mùa mới',
    ],
  },
  {
    id: 'gold',
    name: 'Vàng',
    subtitle: 'Gold',
    threshold: 'Chi tiêu ≥ 10.000.000₫/năm',
    accentColor: '#C8A96E',
    borderClass: 'border-fashionos-accent',
    headerClass: 'bg-gradient-to-br from-fashionos-accent/20 to-fashionos-accent/5',
    badge: 'Cao cấp nhất',
    perks: [
      'Tích 3% CoolCash mỗi đơn hàng',
      'Miễn phí vận chuyển + giao nhanh 2h',
      'Sinh nhật +1.000₫ CoolCash + quà tặng',
      'Đường dây hotline riêng',
      'Mua hàng trước khi ra mắt chính thức',
      'Mời tham dự sự kiện độc quyền',
    ],
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Đăng ký tài khoản',
    desc: 'Tạo tài khoản FashionOS miễn phí — tự động trở thành Thành Viên CoolClub ngay lập tức.',
  },
  {
    step: '02',
    title: 'Mua hàng & tích điểm',
    desc: 'Mỗi đơn hàng được hoàn tất sẽ cộng CoolCash vào tài khoản theo tỉ lệ của hạng thành viên.',
  },
  {
    step: '03',
    title: 'Dùng CoolCash giảm giá',
    desc: 'Áp dụng CoolCash ngay ở trang thanh toán — 1 CoolCash = 1₫ giảm trừ vào tổng đơn.',
  },
  {
    step: '04',
    title: 'Thăng hạng & nhận đặc quyền',
    desc: 'Càng mua nhiều, hạng thành viên càng cao — tỉ lệ tích CoolCash tăng, quyền lợi mở rộng hơn.',
  },
]

const BENEFITS = [
  { icon: CashIcon, title: 'CoolCash Hoàn Tiền', desc: 'Tích lũy tự động sau mỗi đơn hàng, dùng như tiền mặt' },
  { icon: TruckIcon, title: 'Miễn Phí Vận Chuyển', desc: 'Tùy hạng thành viên — từ ngưỡng 500K đến miễn phí toàn bộ' },
  { icon: GiftIcon, title: 'Quà Sinh Nhật', desc: 'CoolCash + quà tặng riêng dành cho ngày sinh nhật của bạn' },
  { icon: BoltIcon, title: 'Mua Sớm Hàng Mới', desc: 'Thành viên Silver & Gold được mua trước khi hàng ra mắt đại trà' },
  { icon: ShieldIcon, title: 'Đổi Trả Ưu Tiên', desc: 'Xử lý đổi trả nhanh hơn, không cần giải thích nhiều' },
  { icon: StarIcon, title: 'Sự Kiện Độc Quyền', desc: 'Thành viên Gold nhận lời mời dự ra mắt BST và sự kiện thương hiệu' },
]

const FAQ = [
  {
    id: 'faq-expiry',
    q: 'CoolCash có hết hạn không?',
    a: 'CoolCash không hết hạn miễn tài khoản của bạn có ít nhất 1 giao dịch trong vòng 12 tháng gần nhất.',
  },
  {
    id: 'faq-tier-calc',
    q: 'Hạng thành viên được tính như thế nào?',
    a: 'Dựa trên tổng chi tiêu thực tế (đã trừ đổi trả) trong 12 tháng gần nhất. Hạng được xét lại vào đầu mỗi năm.',
  },
  {
    id: 'faq-combo',
    q: 'CoolCash có dùng được cùng mã giảm giá không?',
    a: 'Có — CoolCash và mã giảm giá có thể dùng đồng thời trong cùng một đơn hàng.',
  },
  {
    id: 'faq-check-tier',
    q: 'Làm sao để biết mình thuộc hạng nào?',
    a: 'Vào trang Tài khoản → tab Đơn hàng để xem tổng chi tiêu năm nay và hạng hiện tại.',
  },
]

// ─── Shared types ─────────────────────────────────────────────────────────────

type IconProps = { className?: string }

// ─── Page component ───────────────────────────────────────────────────────────

export default function CoolClubPage(): JSX.Element {
  const [loggedIn, setLoggedIn] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
    setHydrated(true)
    const sync = () => setLoggedIn(isLoggedIn())
    window.addEventListener('fashionos:auth', sync)
    return () => window.removeEventListener('fashionos:auth', sync)
  }, [])

  return (
    <main>
      <HeroSection loggedIn={hydrated ? loggedIn : false} />
      <StatsBar />
      <HowItWorksSection />
      <TiersSection loggedIn={hydrated ? loggedIn : false} />
      <BenefitsSection />
      <FaqSection />
      {hydrated && <CtaBanner loggedIn={loggedIn} />}
    </main>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ loggedIn }: { loggedIn: boolean }): JSX.Element {
  return (
    <section className="relative min-h-[min(680px,88vh)] bg-fashionos-black text-fashionos-white flex items-center overflow-hidden">
      {/* Dot-grid texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(200,169,110,0.25) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Gold burst glow top-right */}
      <div
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.15) 0%, transparent 65%)' }}
      />
      {/* Subtle glow bottom-left */}
      <div
        className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.07) 0%, transparent 70%)' }}
      />

      <div className="section-wrap relative z-10 w-full py-20 lg:py-28">
        <div className="max-w-3xl space-y-7">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-fashionos-accent" />
            <p className="text-fashionos-accent text-[11px] tracking-[0.4em] uppercase font-medium">
              Chương trình khách hàng thân thiết
            </p>
          </div>

          {/* Headline */}
          <h1
            className="text-[clamp(3.5rem,8vw+0.5rem,7rem)] leading-[0.88] font-bold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Cool
            <em className="not-italic text-fashionos-accent">Club</em>
          </h1>

          <p className="text-fashionos-muted text-base sm:text-lg leading-relaxed max-w-xl">
            Tích điểm mỗi đơn hàng. Đổi thành tiền mặt. Thăng hạng để nhận
            quyền lợi độc quyền — dành riêng cho những khách hàng thực sự trung thành.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {loggedIn ? (
              <Link href="/account" className="btn-accent">
                Xem tài khoản của tôi
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-accent">
                  Tham gia ngay — miễn phí
                </Link>
                <Link href="/login" className="btn-outline !border-white/30 !text-white hover:!bg-white/10 hover:!text-white">
                  Đã có tài khoản
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Decorative large text watermark */}
      <div
        className="absolute right-0 bottom-0 text-[clamp(6rem,18vw,16rem)] font-bold uppercase leading-none text-white/[0.03] pointer-events-none select-none"
        style={{ fontFamily: 'var(--font-display)' }}
        aria-hidden
      >
        CC
      </div>
    </section>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar(): JSX.Element {
  const stats = [
    { value: '50.000+', label: 'Thành viên CoolClub' },
    { value: '3 hạng', label: 'Thành viên khác nhau' },
    { value: '1–3%', label: 'CoolCash hoàn lại' },
    { value: '30 ngày', label: 'Đổi trả miễn phí' },
  ]

  return (
    <div className="bg-fashionos-black text-fashionos-white border-t border-white/10">
      <div className="section-wrap py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/10">
          {stats.map((s) => (
            <div key={s.value} className="text-center md:px-6">
              <p
                className="text-2xl sm:text-3xl font-bold text-fashionos-accent mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {s.value}
              </p>
              <p className="text-xs tracking-widest uppercase text-fashionos-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection(): JSX.Element {
  return (
    <section className="py-[var(--section-gap)] bg-fashionos-white">
      <div className="section-wrap">
        {/* Header */}
        <div className="mb-14 max-w-xl">
          <p className="text-fashionos-accent text-[11px] tracking-[0.35em] uppercase font-medium mb-3">
            Cách hoạt động
          </p>
          <h2
            className="text-[var(--text-display)] font-bold uppercase leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Đơn giản.<br />Minh bạch.
          </h2>
          <p className="text-fashionos-muted leading-relaxed">
            Không cần thẻ vật lý, không cần cài app riêng. Toàn bộ quyền lợi được quản lý
            ngay trong tài khoản FashionOS của bạn.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="relative">
              {/* Connector line (desktop) */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(100%_-_1rem)] w-8 h-px bg-fashionos-border z-10" />
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-4xl font-bold text-fashionos-accent/30 leading-none"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {step.step}
                  </span>
                  <div className="h-px flex-1 bg-fashionos-border" />
                </div>
                <h3 className="font-semibold text-fashionos-black text-base">{step.title}</h3>
                <p className="text-fashionos-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

function TiersSection({ loggedIn }: { loggedIn: boolean }): JSX.Element {
  return (
    <section className="py-[var(--section-gap)] bg-fashionos-surface">
      <div className="section-wrap">
        {/* Header */}
        <div className="mb-14 max-w-xl">
          <p className="text-fashionos-accent text-[11px] tracking-[0.35em] uppercase font-medium mb-3">
            Hạng thành viên
          </p>
          <h2
            className="text-[var(--text-display)] font-bold uppercase leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Càng trung thành,<br />càng nhiều đặc quyền.
          </h2>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative border-2 ${tier.borderClass} bg-fashionos-white rounded-sm overflow-hidden flex flex-col`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute top-4 right-4 bg-fashionos-accent text-fashionos-black text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1">
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div className={`${tier.headerClass} px-6 py-7 border-b border-fashionos-border`}>
                <p className="text-[11px] tracking-[0.3em] uppercase text-fashionos-muted mb-1">
                  {tier.subtitle}
                </p>
                <h3
                  className="text-2xl font-bold uppercase mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {tier.name}
                </h3>
                <p className="text-xs text-fashionos-muted">{tier.threshold}</p>
              </div>

              {/* Perks */}
              <div className="px-6 py-6 flex-1">
                <ul className="space-y-3">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-3 text-sm">
                      <CheckIcon className="w-4 h-4 text-fashionos-accent flex-shrink-0 mt-0.5" />
                      <span className="text-fashionos-black leading-snug">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                {loggedIn ? (
                  <Link href="/account" className="btn-outline w-full text-center">
                    Xem trạng thái của tôi
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className={`w-full text-center ${tier.id === 'gold' ? 'btn-accent' : 'btn-outline'}`}
                  >
                    Bắt đầu miễn phí
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-fashionos-muted">
          * Hạng thành viên được xét lại vào đầu mỗi năm dương lịch dựa trên tổng chi tiêu 12 tháng trước.
        </p>
      </div>
    </section>
  )
}

// ─── Benefits grid ────────────────────────────────────────────────────────────

function BenefitsSection(): JSX.Element {
  return (
    <section className="py-[var(--section-gap)] bg-fashionos-white">
      <div className="section-wrap">
        <div className="mb-14 max-w-xl">
          <p className="text-fashionos-accent text-[11px] tracking-[0.35em] uppercase font-medium mb-3">
            Quyền lợi
          </p>
          <h2
            className="text-[var(--text-display)] font-bold uppercase leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Mọi thứ bạn<br />xứng đáng có.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group flex gap-5">
              <div className="w-12 h-12 bg-fashionos-surface border border-fashionos-border flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-fashionos-accent group-hover:border-fashionos-accent">
                <Icon className="w-5 h-5 text-fashionos-accent group-hover:text-fashionos-black transition-colors" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-fashionos-black text-sm">{title}</h3>
                <p className="text-fashionos-muted text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqSection(): JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-[var(--section-gap)] bg-fashionos-surface border-t border-fashionos-border">
      <div className="section-wrap">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16">
          {/* Left */}
          <div>
            <p className="text-fashionos-accent text-[11px] tracking-[0.35em] uppercase font-medium mb-3">
              FAQ
            </p>
            <h2
              className="text-[var(--text-display)] font-bold uppercase leading-tight mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Câu hỏi<br />thường gặp.
            </h2>
            <p className="text-fashionos-muted text-sm leading-relaxed">
              Nếu không tìm thấy câu trả lời, liên hệ chúng tôi qua email{' '}
              <a href="mailto:support@fashionos.vn" className="text-fashionos-black underline underline-offset-2">
                support@fashionos.vn
              </a>
            </p>
          </div>

          {/* Accordion */}
          <div className="divide-y divide-fashionos-border border-t border-fashionos-border">
            {FAQ.map((item, i) => (
              <div key={item.id}>
                <button
                  className="w-full flex items-start justify-between gap-4 py-5 text-left group"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  aria-expanded={openIndex === i}
                  aria-label={item.q}
                >
                  <span className="font-medium text-fashionos-black text-sm group-hover:text-fashionos-accent transition-colors">
                    {item.q}
                  </span>
                  <span className="flex-shrink-0 mt-0.5">
                    <ChevronDownIcon
                      className={`w-4 h-4 text-fashionos-muted transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>
                {openIndex === i && (
                  <p className="pb-5 text-sm text-fashionos-muted leading-relaxed -mt-1">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA banner ───────────────────────────────────────────────────────────────

function CtaBanner({ loggedIn }: { loggedIn: boolean }): JSX.Element | null {
  if (loggedIn) return null

  return (
    <section className="bg-fashionos-black text-fashionos-white py-20 overflow-hidden relative">
      {/* Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(200,169,110,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="section-wrap relative z-10 text-center space-y-7">
        <p className="text-fashionos-accent text-[11px] tracking-[0.4em] uppercase font-medium">
          Tham gia ngay hôm nay
        </p>
        <h2
          className="text-[clamp(2rem,5vw+0.5rem,4rem)] font-bold uppercase leading-tight mx-auto max-w-2xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Mỗi đơn hàng đều<br />
          <em className="not-italic text-fashionos-accent">mang lại giá trị hơn.</em>
        </h2>
        <p className="text-fashionos-muted text-base max-w-md mx-auto leading-relaxed">
          Đăng ký tài khoản FashionOS — tự động gia nhập CoolClub và bắt đầu
          tích CoolCash từ đơn hàng đầu tiên.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/register" className="btn-accent">
            Đăng ký miễn phí
          </Link>
          <Link
            href="/products"
            className="btn-ghost !text-fashionos-muted hover:!text-fashionos-white"
          >
            Khám phá sản phẩm →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  )
}

function CashIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}

function TruckIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  )
}

function GiftIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function BoltIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

function ShieldIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function StarIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function ChevronDownIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
