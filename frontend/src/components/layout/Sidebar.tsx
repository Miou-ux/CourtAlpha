import { NavLink } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarDays,
  Eye,
  LayoutGrid,
  LineChart,
  Lock,
  LogIn,
  LogOut,
  Settings,
  Send,
  Sparkles,
  Target,
  Trophy,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { TELEGRAM_CHANNEL_URL } from '../../lib/seo'
import { cn } from '../../lib/utils'
import { isAdmin, isPremium } from '../../lib/auth'
import { useAuth } from '../../context/AuthContext'
import { CourtAlphaLogo } from '../CourtAlphaLogo'

type SidebarProps = {
  counts: { live: number; paris: number; top5: number; topProbas?: number }
  mobileOpen?: boolean
  onNavigate?: () => void
}

const publicLinks = [
  { to: '/1-day-1-pick', label: '1 Day 1 Pick', icon: Target, key: null },
  { to: '/methodo', label: 'Methodo', icon: Sparkles, key: null },
  { to: '/1-day-1-pick/archive', label: 'Archives', icon: CalendarDays, key: null },
]

const accountLinks = [
  { to: '/portfolio', label: 'Portefeuille', icon: Wallet, key: 'portfolio' as const },
  { to: '/profile', label: 'Profil', icon: User, key: null },
]

const premiumLinks = [
  { to: '/live', label: 'Live Tracker', icon: LayoutGrid, key: 'live' as const },
  { to: '/paris', label: 'Paris du jour', icon: CalendarDays, key: 'paris' as const },
  { to: '/top5', label: 'Top 5', icon: Trophy, key: 'top5' as const },
  { to: '/top-probas', label: 'Top probas', icon: LineChart, key: 'topProbas' as const },
]

const adminLinks = [
  { to: '/backtest', label: 'Backtest', icon: BarChart3 },
  { to: '/tracking', label: 'Tracking', icon: Activity },
  { to: '/frequentation', label: 'Fréquentation', icon: Eye },
  { to: '/settings', label: 'Paramètres', icon: Settings },
]

function NavItem({
  to,
  label,
  icon: Icon,
  count,
  locked,
  onNavigate,
}: {
  to: string
  label: string
  icon: typeof LayoutGrid
  count?: number | null
  locked?: boolean
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition',
          isActive
            ? 'border-l-2 border-accent bg-accent/10 pl-[10px] font-medium text-accent'
            : 'border-l-2 border-transparent text-muted hover:bg-panel hover:text-white',
          locked && 'opacity-80',
        )
      }
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
        {locked && <Lock className="h-3 w-3 shrink-0 opacity-60" />}
      </span>
      {count != null && count > 0 && (
        <span className="quant rounded-md bg-accent/15 px-1.5 py-0.5 text-xs text-accent">{count}</span>
      )}
    </NavLink>
  )
}

export function Sidebar({ counts, mobileOpen = false, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const showAdmin = isAdmin(user)
  const premium = isPremium(user)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[min(280px,88vw)] flex-col border-r border-border bg-bg-elevated px-3 py-4 transition-transform duration-200 ease-out md:static md:z-auto md:w-auto md:min-h-screen md:translate-x-0 md:py-5',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <CourtAlphaLogo size="lg" className="max-h-24 w-full md:hidden" />
        <CourtAlphaLogo size="xl" className="hidden w-full md:block" />
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-lg p-2 text-muted transition hover:bg-panel hover:text-white md:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {!user && (
        <NavLink
          to="/login"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'mb-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition',
              isActive ? 'bg-accent/10 text-white' : 'text-muted hover:bg-panel hover:text-white',
            )
          }
        >
          <LogIn className="h-4 w-4" />
          Connexion
        </NavLink>
      )}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Public</p>
        {publicLinks.map((l) => (
          <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} onNavigate={onNavigate} />
        ))}
        {TELEGRAM_CHANNEL_URL ? (
          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-xl border-l-2 border-transparent px-3 py-2 text-sm text-muted transition hover:bg-panel hover:text-white"
          >
            <Send className="h-4 w-4 shrink-0" />
            Canal Telegram
          </a>
        ) : null}
        {user && (
          <>
            <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Compte</p>
            {accountLinks.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} onNavigate={onNavigate} />
            ))}
          </>
        )}
        <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Premium</p>
        {premiumLinks.map((l) => (
          <NavItem
            key={l.to}
            to={l.to}
            label={l.label}
            icon={l.icon}
            count={l.key ? counts[l.key] : undefined}
            locked={!!user && !premium}
            onNavigate={onNavigate}
          />
        ))}
        <NavItem to="/pricing" label="Tarifs" icon={Sparkles} onNavigate={onNavigate} />
        {showAdmin && (
          <>
            <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Admin</p>
            {adminLinks.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </nav>
      {user && (
        <div className="mt-auto border-t border-border pt-4">
          <button
            type="button"
            onClick={() => {
              onNavigate?.()
              void logout()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted transition hover:bg-panel hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  )
}
