import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { Map, MapPin, Recycle, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

type NavItem = { label: string; href: string; icon: ReactNode }

const ADMIN_NAV: NavItem[] = [
  { label: 'Карта и обращения', href: '/admin/map', icon: <Map size={18} /> },
  { label: 'Контейнеры', href: '/admin/waste', icon: <Recycle size={18} /> },
  { label: 'Настройки', href: '/admin/settings', icon: <Settings size={18} /> },
]

export const CITIZEN_NAV: NavItem[] = [
  { label: 'Новая заявка', href: '/citizen/report', icon: <MapPin size={18} /> },
  { label: 'Мои заявки', href: '/citizen/my-reports', icon: <ShieldCheck size={18} /> },
  { label: 'Проверка', href: '/citizen/verify', icon: <ShieldCheck size={18} /> },
  { label: 'Профиль', href: '/citizen/profile', icon: <UserRound size={18} /> },
]

export const CITIZEN_PAGE_TITLES: Record<string, string> = {
  '/citizen/report': 'Новая заявка',
  '/citizen/my-reports': 'Мои заявки',
  '/citizen/verify': 'Проверка',
  '/citizen/profile': 'Профиль',
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
            end={item.href === '/admin/map'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Актау</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end
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
    </aside>
  )
}

export function Sidebar({ role }: { role: 'admin' | 'citizen' }) {
  const items = role === 'admin' ? ADMIN_NAV : CITIZEN_NAV

  return role === 'admin' ? renderAdminSidebar(items) : renderCitizenSidebar(items)
}
