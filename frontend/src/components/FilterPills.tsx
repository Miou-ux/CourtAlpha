import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { FieldLabel, Input } from './ui/input'

export type CircuitFilter = 'all' | 'atp' | 'wta'

export type LiveRangeFilters = {
  probaMin: string
  oddMin: string
  oddMax: string
}

type FilterPillsProps = {
  circuit: CircuitFilter
  search: string
  onCircuit: (v: CircuitFilter) => void
  onSearch: (v: string) => void
  ranges?: LiveRangeFilters
  onRanges?: (patch: Partial<LiveRangeFilters>) => void
}

const circuits: { id: CircuitFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'filters.all' },
  { id: 'atp', labelKey: 'ATP' },
  { id: 'wta', labelKey: 'WTA' },
]

export function FilterPills({ circuit, search, onCircuit, onSearch, ranges, onRanges }: FilterPillsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {circuits.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onCircuit(c.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                circuit === c.id
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border text-muted hover:border-accent/40 hover:text-white',
              )}
            >
              {c.id === 'all' ? t('filters.all') : c.labelKey}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('filters.searchPlayer')}
          className="md:max-w-xs"
        />
      </div>
      {ranges && onRanges && (
        <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
          <label className="text-xs">
            <FieldLabel>{t('filters.probaMin')}</FieldLabel>
            <Input
              type="number"
              quant
              min={0}
              max={100}
              step={1}
              value={ranges.probaMin}
              onChange={(e) => onRanges({ probaMin: e.target.value })}
              placeholder="ex. 60"
            />
          </label>
          <label className="text-xs">
            <FieldLabel>{t('filters.oddMin')}</FieldLabel>
            <Input
              type="number"
              quant
              min={1.01}
              step={0.05}
              value={ranges.oddMin}
              onChange={(e) => onRanges({ oddMin: e.target.value })}
              placeholder="ex. 1.50"
            />
          </label>
          <label className="text-xs">
            <FieldLabel>{t('filters.oddMax')}</FieldLabel>
            <Input
              type="number"
              quant
              min={1.01}
              step={0.05}
              value={ranges.oddMax}
              onChange={(e) => onRanges({ oddMax: e.target.value })}
              placeholder="ex. 3.00"
            />
          </label>
        </div>
      )}
    </div>
  )
}
