// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router'
import { LayoutDashboard, Map, BarChart3, Users, MessageSquare, Settings, MapPin } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import type { ReactNode } from 'react'

type NavItem = { label: string; href: string; icon: ReactNode }

const ADMIN_NAV: NavItem[] = [
  { label: 'Обзор',      href: '/admin',          icon: <LayoutDashboard size={18} /> },
  { label: 'Карта',      href: '/admin/map',       icon: <Map size={18} /> },
  { label: 'Аналитика',  href: '/admin/analytics', icon: <BarChart3 size={18} /> },
  { label: 'Сообщество', href: '/admin/community', icon: <Users size={18} /> },
  { label: 'Сообщения',  href: '/admin/messages',  icon: <MessageSquare size={18} /> },
  { label: 'Настройки',  href: '/admin/settings',  icon: <Settings size={18} /> },
]

const CITIZEN_NAV: NavItem[] = [
  { label: 'Подать жалобу', href: '/citizen/report',      icon: <MapPin size={18} /> },
  { label: 'Мои обращения', href: '/citizen/my-reports',  icon: <LayoutDashboard size={18} /> },
  { label: 'Карта',         href: '/citizen/map',         icon: <Map size={18} /> },
  { label: 'Проверка',      href: '/citizen/verify',      icon: <Users size={18} /> },
  { label: 'Рейтинг',       href: '/citizen/rating',      icon: <BarChart3 size={18} /> },
]

export function Sidebar({ role }: { role: 'admin' | 'citizen' }) {
  const items = role === 'admin' ? ADMIN_NAV : CITIZEN_NAV

  return (
    <aside className="flex flex-col w-56 h-screen bg-white border-r border-slate-200 px-3 py-5 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-7">
        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
          <MapPin size={16} className="text-white" />
        </div>
        <span className="text-[15px] font-extrabold text-slate-900">{APP_NAME}</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {items.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin' || item.href === '/citizen/report'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 px-2">Stronger city. Together.</p>
      </div>
    </aside>
  )
}
