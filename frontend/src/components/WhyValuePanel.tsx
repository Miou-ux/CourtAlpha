import { ChevronDown, Info } from 'lucide-react'
import { useState } from 'react'
import type { WhyValueExplain } from '../api/client'
import { cn } from '../lib/utils'

type WhyValuePanelProps = {
  explain: WhyValueExplain | null | undefined
}

function KeyValueTable({
  rows,
  cols,
}: {
  rows: Array<Record<string, string | number | null | undefined>>
  cols: [string, string][]
}) {
  if (!rows.length) return <p className="text-xs text-muted">—</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-bg-elevated text-[10px] uppercase tracking-wide text-muted">
          <tr>
            {cols.map(([k, label]) => (
              <th key={k} className="px-2 py-1.5">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {cols.map(([k]) => (
                <td key={k} className="px-2 py-1.5 text-muted">
                  {row[k] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ComparisonTable({ rows }: { rows: WhyValueExplain['comparison'] }) {
  if (!rows?.length) return <p className="text-xs text-muted">—</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-bg-elevated text-[10px] uppercase tracking-wide text-muted">
          <tr>
            <th className="px-2 py-1.5">Indicateur</th>
            <th className="px-2 py-1.5">Joueur</th>
            <th className="px-2 py-1.5">Adversaire</th>
            <th className="px-2 py-1.5">Avantage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-2 py-1.5 font-medium text-white">{r.indicator}</td>
              <td className="quant px-2 py-1.5 text-muted">{r.player}</td>
              <td className="quant px-2 py-1.5 text-muted">{r.opponent}</td>
              <td className="px-2 py-1.5 text-accent">{r.advantage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function WhyValuePanel({ explain }: WhyValuePanelProps) {
  const [open, setOpen] = useState(false)

  if (!explain) return null

  return (
    <div className="mb-3 rounded-xl border border-border bg-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-accent transition hover:bg-bg-elevated/60"
      >
        <span className="inline-flex items-center gap-1.5">
          <Info className="h-4 w-4" /> Pourquoi cette value ?
        </span>
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-3 py-3">
          {explain.quick_summary && (
            <p className="text-xs leading-relaxed text-muted">{explain.quick_summary}</p>
          )}

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Human Factors</p>
            <KeyValueTable rows={explain.human_factors ?? []} cols={[['signal', 'Signal'], ['value', 'Valeur']]} />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Comparatif modèle · forme · H2H
            </p>
            <ComparisonTable rows={explain.comparison} />
          </div>

          {(explain.dynamics?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Forme, H2H & contexte</p>
              <KeyValueTable rows={explain.dynamics ?? []} cols={[['Thème', 'Thème'], ['Détail', 'Détail']]} />
            </div>
          )}

          {(explain.advanced?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Signaux avancés</p>
              <KeyValueTable
                rows={explain.advanced ?? []}
                cols={[
                  ['Signal', 'Signal'],
                  ['Lecture', 'Lecture'],
                  ['Contexte', 'Contexte'],
                ]}
              />
            </div>
          )}

          {explain.analysis && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Facteurs déterminants</p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">{explain.analysis}</p>
            </div>
          )}

          {(explain.top_features?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Top features modèle</p>
              <KeyValueTable rows={explain.top_features ?? []} cols={[['Facteur', 'Facteur'], ['Valeur', 'Valeur']]} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
