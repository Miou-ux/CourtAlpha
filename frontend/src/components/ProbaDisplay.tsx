import type { CSSProperties } from 'react'
import { cn } from '../lib/utils'
import { formatProbaPct, probaGradientStyles } from '../lib/modelProba'

type ProbaDisplayProps = {
  pct: number | null | undefined
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-sm',
  md: 'text-base md:text-lg',
  lg: 'text-lg md:text-xl',
}

export function ProbaDisplay({ pct, label, size = 'md', className }: ProbaDisplayProps) {
  const v = pct != null && Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : null
  const grad = v != null && v > 0 ? probaGradientStyles(v) : null

  const textStyle: CSSProperties | undefined = grad
    ? {
        backgroundImage: grad.backgroundImage,
        backgroundSize: grad.backgroundSize,
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }
    : undefined

  return (
    <div className={className}>
      {label && <p className="text-xs text-muted">{label}</p>}
      <p className={cn('quant font-semibold', sizes[size], v == null && 'text-muted')} style={textStyle}>
        {formatProbaPct(pct)}
      </p>
      {v != null && v > 0 && grad && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-bg-elevated">
          <div
            className="h-full overflow-hidden transition-[width] duration-300"
            style={{
              width: `${v}%`,
              boxShadow: `0 0 10px color-mix(in srgb, ${grad.edgeColor} 40%, transparent)`,
            }}
          >
            <div
              className="h-full"
              style={{
                width: grad.innerWidthPct,
                backgroundImage: grad.backgroundImage,
                backgroundSize: '100% 100%',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
