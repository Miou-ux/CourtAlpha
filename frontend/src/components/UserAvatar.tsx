import { cn } from '../lib/utils'
import type { AuthUser } from '../api/client'

type UserAvatarProps = {
  user: Pick<AuthUser, 'display_name' | 'username' | 'avatar_url'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 2) || '?').toUpperCase()
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const label = user.display_name || user.username
  const src = user.avatar_url ? `${user.avatar_url}?v=${encodeURIComponent(user.username)}` : null

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-border bg-panel',
        sizes[size],
        className,
      )}
      title={label}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal/30 to-accent/20 font-semibold text-accent">
          {initials(label)}
        </span>
      )}
    </div>
  )
}
