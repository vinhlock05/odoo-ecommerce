import type { ReactNode } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

type BadgeVariant =
  | 'default'
  | 'new'
  | 'sale'
  | 'hot'
  | 'sold-out'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'diamond'
  | 'success'
  | 'warning'
  | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

// ─── Style map ──────────────────────────────────────────────────────────────

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-fashionos-surface text-fashionos-muted border border-fashionos-border',
  new: 'bg-fashionos-black text-fashionos-white',
  sale: 'bg-fashionos-danger text-white',
  hot: 'bg-fashionos-accent text-fashionos-black',
  'sold-out': 'bg-fashionos-muted/20 text-fashionos-muted line-through',
  // CoolClub tier badges
  bronze: 'bg-[#CD7F32]/15 text-[#8B5A1A] border border-[#CD7F32]/30',
  silver: 'bg-[#A8A9AD]/15 text-[#5A5B60] border border-[#A8A9AD]/40',
  gold: 'bg-[#FFD700]/20 text-[#7A6000] border border-[#FFD700]/40',
  diamond: 'bg-[#B9F2FF]/30 text-[#006080] border border-[#B9F2FF]/60',
  // Semantic
  success: 'bg-fashionos-success/10 text-fashionos-success border border-fashionos-success/25',
  warning: 'bg-fashionos-warning/10 text-fashionos-warning border border-fashionos-warning/25',
  danger: 'bg-fashionos-danger/10 text-fashionos-danger border border-fashionos-danger/25',
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] uppercase',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

// ─── Tier badge with icon ────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  string,
  { variant: BadgeVariant; icon: string; label: string }
> = {
  bronze: { variant: 'bronze', icon: '🥉', label: 'Bronze' },
  silver: { variant: 'silver', icon: '🥈', label: 'Silver' },
  gold: { variant: 'gold', icon: '🥇', label: 'Gold' },
  diamond: { variant: 'diamond', icon: '💎', label: 'Diamond' },
}

interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  showIcon?: boolean
  className?: string
}

export function TierBadge({ tier, showIcon = true, className = '' }: TierBadgeProps) {
  const cfg = TIER_CONFIG[tier]
  return (
    <Badge variant={cfg.variant} className={className}>
      {showIcon && <span className="mr-1">{cfg.icon}</span>}
      {cfg.label}
    </Badge>
  )
}

// ─── Discount badge ──────────────────────────────────────────────────────────

interface DiscountBadgeProps {
  percent: number
  className?: string
}

export function DiscountBadge({ percent, className = '' }: DiscountBadgeProps) {
  return (
    <Badge variant="sale" className={className}>
      -{percent}%
    </Badge>
  )
}
