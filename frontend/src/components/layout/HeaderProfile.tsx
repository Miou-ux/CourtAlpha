import { NavLink } from 'react-router-dom'

import { LogIn, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../context/AuthContext'

import { adminRoleLabel, isAdmin } from '../../lib/auth'

import { cn } from '../../lib/utils'

import { Badge } from '../Badge'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { UserAvatar } from '../UserAvatar'

export function HeaderProfile() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated sm:h-10 sm:w-10"
        aria-hidden
      >
        <div className="h-4 w-4 animate-pulse rounded-full bg-muted/40" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <NavLink
          to="/login"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-bg-elevated px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-accent hover:bg-accent/10 sm:px-4 sm:text-sm"
        >
          <LogIn className="h-4 w-4 shrink-0 text-accent" />
          <span className="whitespace-nowrap">{t('nav.login')}</span>
        </NavLink>
      </div>
    )
  }

  const handle = user.telegram_username ? `@${user.telegram_username}` : `@${user.username}`
  const showAdmin = isAdmin(user)

  return (
    <div className="flex items-center gap-2">
      <LanguageSwitcher />
      <NavLink
        to="/profile"
        title={t('header.profileTitle', { name: user.display_name })}
        className={({ isActive }) =>
          cn(
            'inline-flex shrink-0 items-center gap-2 rounded-full border bg-bg-elevated py-1 pl-1 pr-2.5 shadow-sm transition sm:gap-2.5 sm:py-1.5 sm:pr-3',
            isActive
              ? 'border-accent/50 ring-1 ring-accent/25'
              : 'border-border hover:border-accent/40 hover:bg-panel',
          )
        }
        aria-label={t('header.profileAria', { name: user.display_name })}
      >
        <UserAvatar user={user} size="sm" />
        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="flex max-w-[10rem] items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-white">{user.display_name}</span>
            {showAdmin && <Badge tone="accent">{adminRoleLabel(user)}</Badge>}
          </span>
          <span className="block max-w-[10rem] truncate text-[11px] text-muted">{handle}</span>
        </span>
        <User className="h-4 w-4 shrink-0 text-muted sm:hidden" aria-hidden />
      </NavLink>
    </div>
  )
}
