// src/pages/admin/AdminOverview.tsx
import { useEffect, useState } from 'react'
import { getDashboardStats, listReports } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { STATUS_META } from '@/lib/constants'
import { format } from 'date-fns'
import type { DashboardStats, ReportRecord } from '@/types'

const MOCK_TREND = [2,5,3,8,6,9,7,12,10,14]

export default function AdminOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reports, setReports] = useState<ReportRecord[]>([])

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error)
    listReports().then(r => setReports(r.slice(0, 8))).catch(console.error)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">{greeting}, {user?.fullName} 👋</h2>
        <p className="text-sm text-slate-500 mt-0.5">Вот что происходит в Алматы сегодня</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего обращений" value={stats?.totalReports ?? 0}
          sub="за всё время" trend={MOCK_TREND} trendColor="#3b82f6" />
        <StatCard label="В работе" value={stats?.inProgress ?? 0}
          sub="активных кластеров" trend={[4,3,6,5,7,9,8,10,9,11]} trendColor="#f59e0b" />
        <StatCard label="Закрыто" value={stats?.resolved ?? 0}
          sub="решено" trend={[1,2,2,3,4,5,5,7,8,9]} trendColor="#22c55e" />
        <StatCard label="AI точность" value={`${stats?.aiAgreementRate ?? 0}%`}
          sub="проверено AI" trend={[60,65,70,72,75,80,78,82,84,85]} trendColor="#16a34a" />
      </div>

      {/* Recent reports */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">Последние обращения</h3>
          <button className="text-xs text-green-600 font-medium hover:underline">Все обращения</button>
        </div>
        <div className="divide-y divide-slate-50">
          {reports.map(r => {
            const sm = STATUS_META[r.status]
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <img src={r.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">
                    {r.description || r.address || 'Без описания'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{r.district ?? '—'}</p>
                </div>
                <CategoryBadge category={r.userCategory} />
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${sm.bgClass} ${sm.textClass}`}>
                  {sm.label}
                </span>
                <span className="hidden md:block text-[11px] text-slate-400 shrink-0">
                  {format(new Date(r.createdAt), 'dd.MM.yyyy')}
                </span>
              </div>
            )
          })}
          {reports.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Обращений пока нет</p>
          )}
        </div>
      </div>
    </div>
  )
}
