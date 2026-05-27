import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'outline' | 'ghost' | 'accent' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  asChild?: boolean
  children: ReactNode
}

interface LinkButtonProps {
  href: string
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
  prefetch?: boolean
}

// ─── Style map ──────────────────────────────────────────────────────────────

const variantClasses: Record<Variant, string> = {
  primary: 'bg-fashionos-black text-fashionos-white hover:bg-fashionos-accent',
  outline:
    'border border-fashionos-black text-fashionos-black hover:bg-fashionos-black hover:text-fashionos-white',
  ghost: 'text-fashionos-black hover:text-fashionos-accent',
  accent: 'bg-fashionos-accent text-fashionos-black hover:brightness-110',
  danger: 'bg-fashionos-danger text-white hover:brightness-110',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-[10px] tracking-[0.12em]',
  md: 'px-7 py-3.5 text-[11px] tracking-[0.15em]',
  lg: 'px-10 py-4 text-[12px] tracking-[0.18em]',
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed select-none'

// ─── Components ─────────────────────────────────────────────────────────────

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={[baseClasses, variantClasses[variant], sizeClasses[size], className].join(' ')}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Đang xử lý…</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  prefetch,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={[baseClasses, variantClasses[variant], sizeClasses[size], className].join(' ')}
    >
      {children}
    </Link>
  )
}

// ─── Spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="w-3.5 h-3.5 animate-spin shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
