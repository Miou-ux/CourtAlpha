import { NavLink } from 'react-router-dom'
import { Activity, BarChart3, CalendarDays, LayoutGrid, LineChart, LogIn, LogOut, Settings, Trophy, User, Wallet } from 'lucide-react'
import { cn } from '../../lib/utils'
import { adminRoleLabel, isAdmin } from '../../lib/auth'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../Badge'
import { CourtAlphaLogo } from '../CourtAlphaLogo'
import { UserAvatar } from '../UserAvatar'

type SidebarProps = {
  counts: { live: number; paris: number; top5: number; topProbas?: number }
}

const publicLinks = [
  { to: '/live', label: 'Live Tracker', icon: LayoutGrid, key: 'live' as const },
  { to: '/paris', label: 'Paris du jour', icon: CalendarDays, key: 'paris' as const },
  { to: '/top5', label: 'Top 5', icon: Trophy, key: 'top5' as const },
]

const memberLinks = [
  { to: '/top-probas', label: 'Top probas', icon: LineChart, key: 'topProbas' as const },
  { to: '/portfolio', label: 'Portefeuille', icon: Wallet, key: 'portfolio' as const },
]

const adminLinks = [
  { to: '/backtest', label: 'Backtest', icon: BarChart3 },
  { to: '/tracking', label: 'Tracking', icon: Activity },
  { to: '/settings', label: 'Paramètres', icon: Settings },
]

function NavItem({
  to,
  label,
  icon: Icon,
  count,
}: {
  to: string
  label: string
  icon: typeof LayoutGrid
  count?: number | null
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition',
          isActive
            ? 'border-l-2 border-accent bg-accent/10 pl-[10px] font-medium text-accent'
            : 'border-l-2 border-transparent text-muted hover:bg-panel hover:text-white',
        )
      }
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      {count != null && count > 0 && (
        <span className="quant rounded-md bg-accent/15 px-1.5 py-0.5 text-xs text-accent">{count}</span>
      )}
    </NavLink>
  )
}

export function Sidebar({ counts }: SidebarProps) {
  const { user, logout } = useAuth()
  const showAdmin = isAdmin(user)

  return (
    <aside className="flex flex-col border-r border-border bg-bg-elevated px-3 py-5 md:min-h-screen">
      <div className="mb-6 flex justify-center px-1">
        <CourtAlphaLogo size="xl" className="w-full" />
      </div>
      <nav className="space-y-1">
        {publicLinks.map((l) => (
          <NavItem
            key={l.to}
            to={l.to}
            label={l.label}
            icon={l.icon}
            count={counts[l.key]}
          />
        ))}
        {user &&
          memberLinks.map((l) => (
            <NavItem
              key={l.to}
              to={l.to}
              label={l.label}
              icon={l.icon}
              count={l.key === 'topProbas' ? counts.topProbas : null}
            />
          ))}
        {showAdmin && (
          <>
            <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Admin</p>
            {adminLinks.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} />
            ))}
          </>
        )}
      </nav>
      <div className="mt-auto pt-6">
        {user ? (
          <div className="space-y-1">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                  isActive ? 'bg-accent/10 text-white' : 'text-muted hover:bg-panel hover:text-white',
                )
              }
            >
              <UserAvatar user={user} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block truncate font-medium text-white">{user.display_name}</span>
                  {showAdmin && <Badge tone="accent">{adminRoleLabel(user)}</Badge>}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {user.telegram_username ? `@${user.telegram_username}` : `@${user.username}`}
                </span>
              </span>
              <User className="h-4 w-4 shrink-0 opacity-60" />
            </NavLink>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted transition hover:bg-panel hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition',
                isActive ? 'bg-accent/10 text-white' : 'text-muted hover:bg-panel hover:text-white',
              )
            }
          >
            <LogIn className="h-4 w-4" />
            Connexion
          </NavLink>
        )}
      </div>
    </aside>
  )
}
