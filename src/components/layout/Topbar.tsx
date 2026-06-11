// src/components/layout/Topbar.tsx
import { Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Topbar({ title }: { title: string }) {
  const { user, signOut } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Уведомления">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold">
            {user?.fullName?.[0]?.toUpperCase() ?? 'П'}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold text-slate-900 leading-none">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
              {user?.role === 'admin' ? 'Администратор' : 'Житель'}
            </p>
          </div>
        </div>
        <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-700 ml-1">
          Выйти
        </button>
      </div>
    </header>
  )
}
