// src/components/layout/AppShell.tsx
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useLocation } from 'react-router'

const PAGE_TITLES: Record<string, string> = {
  '/admin':              'Обзор города',
  '/admin/map':          'Карта проблем',
  '/admin/analytics':    'Аналитика',
  '/citizen/report':     'Подать жалобу',
  '/citizen/my-reports': 'Мои обращения',
}

export function AppShell({ role, children }: { role: 'admin' | 'citizen'; children: ReactNode }) {
  const loc = useLocation()
  const title = PAGE_TITLES[loc.pathname] ?? 'CityPulse'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
