import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type CardVariant = 'default' | 'glass' | 'elevated'

const variants: Record<CardVariant, string> = {
  default: 'border border-border bg-panel',
  glass: 'glass',
  elevated: 'border border-border bg-bg-elevated',
}

type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant
  children: ReactNode
  as?: 'div' | 'article' | 'section'
  /** Survol : légère élévation + surbrillance (tuiles match / value). */
  interactive?: boolean
}

export function Card({ variant = 'default', className, children, as: Tag = 'div', interactive, ...props }: CardProps) {
  return (
    <Tag
      className={cn('rounded-2xl', variants[variant], interactive && 'tile-lift relative cursor-default', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}
