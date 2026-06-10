// src/components/ui/StatCard.tsx
import { Sparkline } from './Sparkline'
import type { ReactNode } from 'react'

type Props = {
  label: string
  value: number | string
  sub?: string
  trend?: number[]
  trendColor?: string
  icon?: ReactNode
}

export function StatCard({ label, value, sub, trend, trendColor }: Props) {
  return (
    <div className="card p-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      {trend && <div className="mt-1"><Sparkline data={trend} color={trendColor} /></div>}
    </div>
  )
}
