// src/components/layout/Sidebar.tsx
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import {
  BarChart3,
  ClipboardList,
  Heart,
  Home,
  LayoutDashboard,
  Map,
  MapPin,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

type NavItem = { label: string; href: string; icon: ReactNode }

const ADMIN_NAV: NavItem[] = [
  { label: 'Обзор', href: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Карта', href: '/admin/map', icon: <Map size={18} /> },
  { label: 'Аналитика', href: '/admin/analytics', icon: <BarChart3 size={18} /> },
  { label: 'Сообщество', href: '/admin/community', icon: <Users size={18} /> },
  { label: 'Сообщения', href: '/admin/messages', icon: <MessageSquare size={18} /> },
  { label: 'Настройки', href: '/admin/settings', icon: <Settings size={18} /> },
]

export const CITIZEN_NAV: NavItem[] = [
  { label: 'Home', href: '/citizen', icon: <Home size={18} /> },
  { label: 'Map', href: '/citizen/map', icon: <Map size={18} /> },
  { label: 'New Report', href: '/citizen/report', icon: <MapPin size={18} /> },
  { label: 'My Reports', href: '/citizen/my-reports', icon: <ClipboardList size={18} /> },
  { label: 'Verify', href: '/citizen/verify', icon: <ShieldCheck size={18} /> },
  { label: 'Profile', href: '/citizen/profile', icon: <UserRound size={18} /> },
  { label: 'Settings', href: '/citizen/settings', icon: <Settings size={18} /> },
]

export const CITIZEN_PAGE_TITLES: Record<string, string> = {
  '/citizen': 'Explore issues in Almaty',
  '/citizen/map': 'Map',
  '/citizen/report': 'Подать жалобу',
  '/citizen/my-reports': 'Мои обращения',
  '/citizen/verify': 'Проверка',
  '/citizen/profile': 'Профиль',
  '/citizen/settings': 'Настройки',
}

function renderAdminSidebar(items: NavItem[]) {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5">
      <div className="mb-7 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
          <MapPin size={16} className="text-white" />
        </div>
        <span className="text-[15px] font-extrabold text-slate-900">{APP_NAME}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 pt-3">
        <p className="px-2 text-[11px] text-slate-400">Stronger city. Together.</p>
      </div>
    </aside>
  )
}

function renderCitizenSidebar(items: NavItem[]) {
  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-slate-200/70 bg-white/92 px-5 py-6 backdrop-blur">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
          <MapPin size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[15px] font-extrabold tracking-[-0.02em] text-slate-950">{APP_NAME}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Almaty</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/citizen'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition-all',
                isActive
                  ? 'bg-emerald-50 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]'
                  : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-[28px] border border-amber-100 bg-[linear-gradient(180deg,#fffdf7_0%,#fff8ec_100%)] p-4 shadow-[0_22px_55px_-38px_rgba(148,163,184,0.55)]">
        <div className="h-28 rounded-2xl bg-[linear-gradient(135deg,#d7f0db_0%,#f8e7bf_100%)]" />
        <h3 className="mt-4 text-[15px] font-bold leading-6 text-slate-900">Together, we build a better Almaty</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">Every report makes our city stronger.</p>
        <Heart size={18} className="mt-4 text-slate-400" />
      </div>
    </aside>
  )
}

export function Sidebar({ role }: { role: 'admin' | 'citizen' }) {
  const items = role === 'admin' ? ADMIN_NAV : CITIZEN_NAV

  return role === 'admin' ? renderAdminSidebar(items) : renderCitizenSidebar(items)
}
