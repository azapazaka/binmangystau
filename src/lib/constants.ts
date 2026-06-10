// src/lib/constants.ts
import type { ReportCategory, ClusterStatus, AiValidationStatus } from '@/types'

export const APP_NAME = 'CityPulse'

export const CATEGORY_META: Record<ReportCategory, {
  label: string; color: string; bgClass: string; textClass: string
}> = {
  road:    { label: 'Дороги',    color: '#ef4444', bgClass: 'bg-red-100',    textClass: 'text-red-700'    },
  light:   { label: 'Освещение', color: '#f59e0b', bgClass: 'bg-amber-100',  textClass: 'text-amber-700'  },
  trash:   { label: 'Мусор',     color: '#22c55e', bgClass: 'bg-green-100',  textClass: 'text-green-700'  },
  traffic: { label: 'Трафик',    color: '#3b82f6', bgClass: 'bg-blue-100',   textClass: 'text-blue-700'   },
  other:   { label: 'Другое',    color: '#94a3b8', bgClass: 'bg-slate-100',  textClass: 'text-slate-600'  },
}

export const STATUS_META: Record<ClusterStatus, { label: string; bgClass: string; textClass: string }> = {
  open:        { label: 'Открыто',  bgClass: 'bg-red-100',    textClass: 'text-red-700'    },
  in_progress: { label: 'В работе', bgClass: 'bg-amber-100',  textClass: 'text-amber-700'  },
  closed:      { label: 'Закрыто',  bgClass: 'bg-green-100',  textClass: 'text-green-700'  },
}

export const AI_STATUS_META: Record<AiValidationStatus, { label: string; bgClass: string; textClass: string }> = {
  valid:       { label: 'Подтверждено', bgClass: 'bg-green-100', textClass: 'text-green-700'  },
  invalid:     { label: 'Отклонено',    bgClass: 'bg-red-100',   textClass: 'text-red-700'    },
  uncertain:   { label: 'Под вопросом', bgClass: 'bg-amber-100', textClass: 'text-amber-700'  },
  unavailable: { label: 'Нет данных',   bgClass: 'bg-slate-100', textClass: 'text-slate-600'  },
}

export const DEMO_ACCOUNTS = {
  citizen: { email: 'citizen@citypulse.local', password: 'citypulse-demo' },
  admin:   { email: 'demo@citypulse.local',    password: 'citypulse-demo' },
}
