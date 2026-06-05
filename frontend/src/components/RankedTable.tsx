import type { PickRow } from '../api/client'

type RankedTableProps = {
  picks: PickRow[]
}

export function RankedTable({ picks }: RankedTableProps) {
  if (picks.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-panel">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Joueur</th>
            <th className="px-4 py-3">Tournoi</th>
            <th className="px-4 py-3">Proba</th>
            <th className="px-4 py-3">EV</th>
            <th className="px-4 py-3">Cote</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((p, i) => {
            const ev = p.ev_fav_pct ?? p.ev_pct ?? 0
            const proba = p.p_model_pct ?? 0
            return (
              <tr key={i} className="border-b border-border/70 last:border-0 hover:bg-bg-elevated/60">
                <td className="quant px-4 py-3 font-semibold text-accent">{p.rank ?? i + 1}</td>
                <td className="px-4 py-3 font-medium">{p.bet_on}</td>
                <td className="px-4 py-3 text-muted">{p.tournament}</td>
                <td className="quant px-4 py-3 text-success">{proba.toFixed(1)}%</td>
                <td className="quant px-4 py-3 text-success">+{ev.toFixed(1)}%</td>
                <td className="quant px-4 py-3">@{p.odd_fav?.toFixed(2) ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
