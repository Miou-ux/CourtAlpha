import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { quant?: boolean }

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, quant, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-white outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent/40',
      quant && 'quant',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent/40',
        className,
      )}
      {...props}
    />
  ),
)
Select.displayName = 'Select'

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('mb-1 block text-xs uppercase tracking-wide text-muted', className)}>{children}</span>
}
