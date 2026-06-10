// src/components/ui/CategoryBadge.tsx
import { CATEGORY_META } from '@/lib/constants'
import type { ReportCategory } from '@/types'

export function CategoryBadge({ category }: { category: ReportCategory }) {
  const meta = CATEGORY_META[category]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.bgClass} ${meta.textClass}`}>
      {meta.label}
    </span>
  )
}
