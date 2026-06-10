// src/pages/admin/AdminMapPage.tsx
import { useEffect, useState } from 'react'
import { listClusters, updateClusterStatus } from '@/lib/api'
import { CityMap } from '@/components/maps/CityMap'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { STATUS_META } from '@/lib/constants'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import type { ClusterRecord, ReportCategory } from '@/types'

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all',     label: 'Все' },
  { key: 'road',    label: 'Дороги' },
  { key: 'light',   label: 'Освещение' },
  { key: 'trash',   label: 'Мусор' },
  { key: 'traffic', label: 'Трафик' },
  { key: 'other',   label: 'Другое' },
]

export default function AdminMapPage() {
  const [clusters, setClusters] = useState<ClusterRecord[]>([])
  const [cat, setCat] = useState('all')
  const [selected, setSelected] = useState<ClusterRecord | null>(null)

  useEffect(() => {
    listClusters({ category: cat !== 'all' ? cat as ReportCategory : undefined })
      .then(setClusters)
      .catch(console.error)
  }, [cat])

  const handleStatusChange = async (status: ClusterRecord['status']) => {
    if (!selected) return
    try {
      await updateClusterStatus(selected.id, status)
      setClusters(cs => cs.map(c => c.id === selected.id ? { ...c, status } : c))
      setSelected(s => s ? { ...s, status } : null)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-slate-200 overflow-x-auto shrink-0">
        <span className="text-xs text-slate-500 font-medium shrink-0 mr-1">Фильтр:</span>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              cat === c.key
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {c.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 shrink-0">{clusters.length} кластеров</span>
      </div>

      {/* Map + panel */}
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1">
          <CityMap
            clusters={clusters}
            selectedId={selected?.id}
            onSelect={id => setSelected(clusters.find(c => c.id === id) ?? null)}
            height="100%"
          />
        </div>

        {/* Cluster detail panel */}
        {selected && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col overflow-y-auto z-10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <CategoryBadge category={selected.category} />
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {selected.representativePhotoUrl && (
                <img src={selected.representativePhotoUrl} alt=""
                  className="w-full h-36 object-cover rounded-lg" />
              )}

              <div>
                <h3 className="font-bold text-slate-900">
                  {selected.address ?? `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
                </h3>
                {selected.district && (
                  <p className="text-xs text-slate-400 mt-0.5">{selected.district}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-900">{selected.reportCount}</p>
                  <p className="text-[10px] text-slate-400">Обращений</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-900">
                    {selected.priorityScore > 66 ? 'Выс.' : selected.priorityScore > 33 ? 'Сред.' : 'Низк.'}
                  </p>
                  <p className="text-[10px] text-slate-400">Приоритет</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-900">{Math.round(selected.priorityScore)}</p>
                  <p className="text-[10px] text-slate-400">Рейтинг</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Статус</p>
                <div className="flex gap-2">
                  {(['open', 'in_progress', 'closed'] as const).map(s => {
                    const sm = STATUS_META[s]
                    return (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                          selected.status === s
                            ? `${sm.bgClass} ${sm.textClass} border-current`
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}>
                        {sm.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Создано: {format(new Date(selected.createdAt), 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
