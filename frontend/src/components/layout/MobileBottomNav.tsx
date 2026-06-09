import { NavLink } from 'react-router-dom'

import { Menu, Sparkles, Target, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PRICING_ENABLED } from '../../lib/features'
import { cn } from '../../lib/utils'

import { useAuth } from '../../context/AuthContext'

const publicTabs = [{ to: '/1-day-1-pick', labelKey: 'nav.onePick', icon: Target }] as const

type MobileBottomNavProps = {
  onMenuClick: () => void
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-panel/95 backdrop-blur-md md:hidden"
      aria-label={t('nav.mainNav')}
    >
      <div
        className={cn(
          'mx-auto grid max-w-lg',
          user
            ? PRICING_ENABLED
              ? 'grid-cols-4'
              : 'grid-cols-3'
            : PRICING_ENABLED
              ? 'grid-cols-3'
              : 'grid-cols-2',
        )}
      >
        {publicTabs.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {t(labelKey)}
          </NavLink>
        ))}
        {user && (
          <NavLink
            to="/portfolio"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            <Wallet className="h-5 w-5" />
            {t('nav.portfolio')}
          </NavLink>
        )}
        {PRICING_ENABLED && (
          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            <Sparkles className="h-5 w-5" />
            {t('nav.premium')}
          </NavLink>
        )}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium text-muted transition hover:text-white"
        >
          <Menu className="h-5 w-5" />
          {t('nav.menu')}
        </button>
      </div>
    </nav>
  )
}
