import type { AccountRole, AiValidationStatus, ClusterStatus, ReportCategory } from "@/types";

export const APP_NAME = "CityPulse";

export const CATEGORY_META: Record<
  ReportCategory,
  {
    label: string;
    description: string;
    color: string;
    accent: string;
  }
> = {
  road: {
    label: "Дороги",
    description: "Ямы, разрушенное покрытие и опасные участки улиц.",
    color: "#d94f3d",
    accent: "bg-[#d94f3d]",
  },
  light: {
    label: "Освещение",
    description: "Неработающие фонари, тёмные дворы и плохо освещённые улицы.",
    color: "#d2a22d",
    accent: "bg-[#d2a22d]",
  },
  trash: {
    label: "Мусор",
    description: "Свалки, переполненные контейнеры и стихийные загрязнения.",
    color: "#2f8a57",
    accent: "bg-[#2f8a57]",
  },
  traffic: {
    label: "Трафик",
    description: "Светофоры, разметка, знаки и опасные транспортные участки.",
    color: "#2563eb",
    accent: "bg-[#2563eb]",
  },
  other: {
    label: "Другое",
    description: "Другие городские проблемы, которые не подходят под основные категории.",
    color: "#64748b",
    accent: "bg-[#64748b]",
  },
};

export const STATUS_META: Record<ClusterStatus, { label: string; tone: string }> = {
  open: {
    label: "Открыто",
    tone: "bg-rose-100 text-rose-900",
  },
  in_progress: {
    label: "В работе",
    tone: "bg-amber-100 text-amber-900",
  },
  closed: {
    label: "Закрыто",
    tone: "bg-emerald-100 text-emerald-900",
  },
};

export const AI_STATUS_META: Record<
  AiValidationStatus,
  { label: string; tone: string; shortLabel: string }
> = {
  valid: {
    label: "Подтверждено ИИ",
    shortLabel: "Подтверждено",
    tone: "bg-emerald-100 text-emerald-900",
  },
  invalid: {
    label: "Требует проверки",
    shortLabel: "Проверить",
    tone: "bg-rose-100 text-rose-900",
  },
  uncertain: {
    label: "Конфликт оценки",
    shortLabel: "Конфликт",
    tone: "bg-amber-100 text-amber-900",
  },
  unavailable: {
    label: "ИИ недоступен",
    shortLabel: "Нет ИИ",
    tone: "bg-slate-100 text-slate-800",
  },
};

export const ROLE_META: Record<
  AccountRole,
  {
    label: string;
    areaTitle: string;
    accent: string;
    description: string;
  }
> = {
  citizen: {
    label: "Гражданин",
    areaTitle: "Кабинет гражданина",
    accent: "from-[#d97f49] via-[#e6bb67] to-[#fbf4e7]",
    description:
      "Подавайте обращения, прикладывайте фотографии и отслеживайте статус своих заявок в одном кабинете.",
  },
  admin: {
    label: "Администратор",
    areaTitle: "Операторская панель",
    accent: "from-[#0f172a] via-[#1e4db7] to-[#dbe5f7]",
    description:
      "Управляйте приоритетами, обрабатывайте обращения и координируйте городские службы через рабочую панель.",
  },
};

export const DEMO_ACCOUNTS: Record<
  AccountRole,
  {
    email: string;
    password: string;
    fullName: string;
  }
> = {
  citizen: {
    email: "citizen@citypulse.local",
    password: "citypulse-demo",
    fullName: "Демо-гражданин",
  },
  admin: {
    email: "demo@citypulse.local",
    password: "citypulse-demo",
    fullName: "Демо-администратор CityPulse",
  },
};

export const DEMO_ADMIN = DEMO_ACCOUNTS.admin;
