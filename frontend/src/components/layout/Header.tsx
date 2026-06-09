import type { ReactNode } from 'react'

import { Activity, Clock3, Menu, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { LiveMeta, PortfolioSummary } from '../../api/client'

import { CourtAlphaLogo } from '../CourtAlphaLogo'

import { HeaderProfile } from './HeaderProfile'

type HeaderProps = {
  meta: LiveMeta | null
  portfolio: PortfolioSummary | null
  showBankroll?: boolean
  onMenuClick?: () => void
}

export function Header({ meta, portfolio, showBankroll, onMenuClick }: HeaderProps) {
  const { t } = useTranslation()

  const chips = (
    <>
      {meta && (
        <>
          <Chip icon={<Activity className="h-3.5 w-3.5" />} label={t('header.scanned')} value={String(meta.n_scanned)} compact />
          <Chip
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label={t('header.snapshot')}
            value={meta.snapshot_age_min != null ? `~${Math.round(meta.snapshot_age_min)} min` : '—'}
            compact
          />
        </>
      )}
      {showBankroll && portfolio && (
        <Chip
          icon={<Wallet className="h-3.5 w-3.5" />}
          label={t('header.available')}
          value={`${portfolio.bankroll.available_eur.toFixed(0)} €`}
          compact
        />
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-panel/95 px-3 py-2.5 backdrop-blur-md sm:px-4 md:px-6 md:py-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-bg-elevated hover:text-white md:hidden"
            aria-label={t('header.openMenu')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <CourtAlphaLogo size="sm" className="h-8 shrink-0 md:hidden" />
          <span className="hidden shrink-0 rounded-full border border-border bg-bg-elevated px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted md:inline">
            Prod
          </span>
          <div className="hidden min-w-0 flex-wrap items-center gap-1.5 lg:flex">{chips}</div>
        </div>
        <div className="shrink-0 justify-self-end">
          <HeaderProfile />
        </div>
      </div>
      {(meta || (showBankroll && portfolio)) && (
        <div className="mt-2 flex flex-wrap gap-1.5 lg:hidden">{chips}</div>
      )}
    </header>
  )
}

function Chip({
  icon,
  label,
  value,
  compact,
}: {
  icon: ReactNode
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-2 py-1 text-xs brand-ring sm:gap-2 sm:px-3 sm:py-1.5">
      <span className="shrink-0 text-accent">{icon}</span>
      <span className={compact ? 'hidden text-muted sm:inline' : 'text-muted'}>{label}</span>
      <span className="quant truncate font-semibold text-white">{value}</span>
    </div>
  )
}
