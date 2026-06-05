import type { ReactNode } from 'react'
import { Activity, Clock3, Wallet } from 'lucide-react'
import type { LiveMeta, PortfolioSummary } from '../../api/client'
type HeaderProps = {
  meta: LiveMeta | null
  portfolio: PortfolioSummary | null
}

export function Header({ meta, portfolio }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-panel/90 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="hidden rounded-full border border-border bg-bg-elevated px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted md:inline">
            Preprod
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {meta && (
            <>
              <Chip icon={<Activity className="h-3.5 w-3.5" />} label="Scannés" value={String(meta.n_scanned)} />
              <Chip
                icon={<Clock3 className="h-3.5 w-3.5" />}
                label="Snapshot"
                value={meta.snapshot_age_min != null ? `~${Math.round(meta.snapshot_age_min)} min` : '—'}
              />
            </>
          )}
          {portfolio && (
            <Chip
              icon={<Wallet className="h-3.5 w-3.5" />}
              label="Dispo"
              value={`${portfolio.bankroll.available_eur.toFixed(0)} €`}
            />
          )}
        </div>
      </div>
    </header>
  )
}

function Chip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs brand-ring">
      <span className="text-accent">{icon}</span>
      <span className="text-muted">{label}</span>
      <span className="quant font-semibold text-white">{value}</span>
    </div>
  )
}
