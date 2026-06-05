import { cn } from '../lib/utils'

const LOGO_SRC = '/courtalpha-logo.png'

type CourtAlphaLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** @deprecated Le PNG inclut déjà le wordmark ; conservé pour compat. */
  showWordmark?: boolean
  className?: string
}

const heights = {
  sm: 'h-10',
  md: 'h-14',
  lg: 'h-28',
  xl: 'h-[280px]',
} as const

export function CourtAlphaLogo({ size = 'md', className }: CourtAlphaLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="CourtAlpha"
      className={cn(
        'w-auto max-w-full object-contain',
        heights[size],
        className,
      )}
    />
  )
}

export function CourtAlphaLogoMark({
  className,
  size = 'lg',
}: {
  className?: string
  size?: keyof typeof heights
}) {
  return <CourtAlphaLogo size={size} className={className} />
}
