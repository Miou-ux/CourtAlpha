import { cn } from '../lib/utils'
import { Input } from './ui/input'

export type CircuitFilter = 'all' | 'atp' | 'wta'

type FilterPillsProps = {
  circuit: CircuitFilter
  search: string
  onCircuit: (v: CircuitFilter) => void
  onSearch: (v: string) => void
}

const circuits: { id: CircuitFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'atp', label: 'ATP' },
  { id: 'wta', label: 'WTA' },
]

export function FilterPills({ circuit, search, onCircuit, onSearch }: FilterPillsProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-3 md:flex-row md:items-center md:justify-between">
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
            {c.label}
          </button>
        ))}
      </div>
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Rechercher un joueur…"
        className="md:max-w-xs"
      />
    </div>
  )
}
