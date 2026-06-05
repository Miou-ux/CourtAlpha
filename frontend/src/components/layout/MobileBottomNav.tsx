import { NavLink } from 'react-router-dom'
import { CalendarDays, LayoutGrid, Menu, Trophy } from 'lucide-react'
import { cn } from '../../lib/utils'

const tabs = [
  { to: '/live', label: 'Live', icon: LayoutGrid },
  { to: '/paris', label: 'Paris', icon: CalendarDays },
  { to: '/top5', label: 'Top 5', icon: Trophy },
] as const

type MobileBottomNavProps = {
  onMenuClick: () => void
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-panel/95 backdrop-blur-md md:hidden"
      aria-label="Navigation principale"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
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
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium text-muted transition hover:text-white"
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </div>
    </nav>
  )
}
