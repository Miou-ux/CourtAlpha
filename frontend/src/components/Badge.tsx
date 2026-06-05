import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

type BadgeProps = {
  children: ReactNode
  tone?: 'default' | 'atp' | 'wta' | 'success' | 'danger' | 'accent'
}

const tones = {
  default: 'border-border text-muted bg-bg-elevated',
  atp: 'border-teal/40 text-teal bg-teal/10',
  wta: 'border-accent/40 text-accent bg-accent/10',
  success: 'border-teal/50 text-teal bg-teal/15',
  danger: 'border-danger/50 text-danger bg-danger/15',
  accent: 'border-accent/50 text-accent bg-accent/15',
}

export function Badge({ children, tone = 'default' }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide', tones[tone])}>
      {children}
    </span>
  )
}
