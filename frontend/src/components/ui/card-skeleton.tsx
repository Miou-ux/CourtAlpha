import { cn } from '../../lib/utils'

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-2xl border border-border bg-bg-elevated p-5', className)}>
      <div className="mb-4 h-4 w-2/3 rounded-lg bg-panel" />
      <div className="mb-2 h-3 w-1/2 rounded-lg bg-panel" />
      <div className="mt-6 flex gap-3">
        <div className="h-10 flex-1 rounded-xl bg-panel" />
        <div className="h-10 w-24 rounded-xl bg-panel" />
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
