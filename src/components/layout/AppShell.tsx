import type { ReactNode } from 'react'
import {
  BarChart3,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Map,
  ClipboardList,
  Recycle,
  Settings,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { CityPulseLogo } from '@/components/icons'

const ADMIN_NAV = [
  { label: 'Обзор', href: '/admin', icon: LayoutDashboard },
  { label: 'Обращения', href: '/admin/reports', icon: ClipboardList },
  { label: 'Карта', href: '/admin/map', icon: Map },
  { label: 'Контейнеры', href: '/admin/waste', icon: Recycle },
  { label: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Сообщество', href: '/admin/community', icon: Users },
  { label: 'Настройки', href: '/admin/settings', icon: Settings },
]

function AdminSidebar() {
  return (
    <aside className="citizen-v2-sidebar">
      <div className="citizen-v2-brand">
        <CityPulseLogo size={34} />
        <div>
          <p className="citizen-v2-brand-title">CityPulse</p>
          <p className="citizen-v2-brand-city">Оператор</p>
        </div>
      </div>

      <nav className="citizen-v2-nav">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                `citizen-v2-nav-link${isActive ? ' is-active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="citizen-v2-sidebar-card">
        <p className="citizen-v2-sidebar-card-title">Городской контур</p>
        <p className="citizen-v2-sidebar-card-body">
          Обращения, карта, контейнеры и аналитика в одном рабочем окне.
        </p>
      </div>
    </aside>
  )
}

function AdminTopbar() {
  const { user, signOut } = useAuth()
  const name = user?.fullName?.trim() || 'Оператор'

  return (
    <div className="citizen-v2-topbar">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Все районы
          <ChevronDown size={12} className="text-slate-400" />
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Все категории
          <ChevronDown size={12} className="text-slate-400" />
        </div>
      </div>
      <div className="citizen-v2-topbar-actions">
        <button type="button" className="citizen-v2-icon-button" style={{ width: 38, height: 38 }} aria-label="Уведомления">
          <Bell size={16} />
          <span className="citizen-v2-notification-dot" aria-hidden="true" />
        </button>
        <button type="button" className="citizen-v2-profile-button">
          <span className="citizen-v2-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="citizen-v2-profile-copy">
            <span className="citizen-v2-profile-name" style={{ fontSize: '0.82rem' }}>{name}</span>
            <span className="citizen-v2-profile-role" style={{ fontSize: '0.72rem' }}>Администратор</span>
          </span>
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Выйти"
        >
          <LogOut size={14} />
          Выйти
        </button>
      </div>
    </div>
  )
}

export function AppShell({ children }: { role: string; children: ReactNode }) {
  return (
    <div className="citizen-v2-scene">
      <div className="citizen-v2-frame">
        <AdminSidebar />
        <div className="citizen-v2-main">
          <AdminTopbar />
          <div className="citizen-v2-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export { ADMIN_NAV }
