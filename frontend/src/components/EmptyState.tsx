import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  title: string
  hint?: string
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-panel/40 px-6 py-14 text-center">
      <Inbox className="mb-3 h-8 w-8 text-muted" />
      <p className="text-sm font-medium text-white">{title}</p>
      {hint && <p className="mt-2 max-w-md text-sm text-muted">{hint}</p>}
    </div>
  )
}
