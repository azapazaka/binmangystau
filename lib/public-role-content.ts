import type { AccountRole } from "@/types";

import { getLoginPathForRole, getRegisterPathForRole } from "@/lib/role-config";

export type PublicRoleKey = AccountRole;

export type PublicRoleContent = {
  key: PublicRoleKey;
  pageHref: string;
  navLabel: string;
  roleLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  heroSecondaryLabel: string;
  previewTitle: string;
  previewDescription: string;
  previewTag: string;
  previewListTitle: string;
  capabilitiesTitle: string;
  capabilitiesDescription: string;
  workflowTitle: string;
  workflowDescription: string;
  summaryTitle: string;
  summaryDescription: string;
  features: readonly string[];
  overview: ReadonlyArray<{
    title: string;
    description: string;
  }>;
  workflow: readonly string[];
};

const citizenContent: PublicRoleContent = {
  key: "citizen",
  pageHref: "/for-citizen",
  navLabel: "Для гражданина",
  roleLabel: "Гражданин",
  heroTitle: "Один понятный обзор по вашим городским обращениям.",
  heroDescription:
    "Подавайте жалобы, следите за статусами и держите под рукой личную активность без перегруженного интерфейса.",
  heroCtaLabel: "Регистрация гражданина",
  heroSecondaryLabel: "Войти",
  previewTitle: "Подача жалоб и история обращений без лишней рутины.",
  previewDescription: "Быстрый вход в обращения, статусы, профиль и личный рейтинг.",
  previewTag: "Citizen",
  previewListTitle: "Что видно сразу",
  capabilitiesTitle: "Главные сценарии гражданина",
  capabilitiesDescription: "Только то, что помогает быстро ориентироваться и доводить заявку до результата.",
  workflowTitle: "Минимум шагов до результата",
  workflowDescription: "Один спокойный поток от категории и фото до адреса и отправки заявки.",
  summaryTitle: "Спокойный кабинет без лишней рутины",
  summaryDescription: "История, профиль и рейтинг собраны в одной понятной среде.",
  features: [
    "Подача жалобы с фото и адресом",
    "История обращений и статусов",
    "Личный рейтинг и профиль",
  ],
  overview: [
    {
      title: "Заявки",
      description: "Новые сигналы, история и статусы без лишних экранов.",
    },
    {
      title: "Профиль",
      description: "Роль, активность и личная сводка в одном месте.",
    },
    {
      title: "Рейтинг",
      description: "Прогресс и участие в улучшении города.",
    },
  ],
  workflow: [
    "Выберите категорию и добавьте фото",
    "Укажите место: адрес, геолокация или карта",
    "Отправьте заявку и следите за статусом",
  ],
};

const adminContent: PublicRoleContent = {
  key: "admin",
  pageHref: "/for-admin",
  navLabel: "Для админа",
  roleLabel: "Админ",
  heroTitle: "Рабочая зона, в которой важные обращения видны сразу.",
  heroDescription:
    "Очередь жалоб, карта кластеров и аналитика собраны в одной аккуратной среде без визуального мусора.",
  heroCtaLabel: "Регистрация админа",
  heroSecondaryLabel: "Войти",
  previewTitle: "Фокус на очереди, карте и аналитике без перегруза.",
  previewDescription: "Операторский поток для приоритетов, статусов и районной картины.",
  previewTag: "Admin",
  previewListTitle: "Что видно сразу",
  capabilitiesTitle: "Главные сценарии админа",
  capabilitiesDescription: "Рабочий контур без лишней перегрузки и второстепенных виджетов.",
  workflowTitle: "Один продукт, одна рабочая среда",
  workflowDescription: "Очередь, карта и аналитика остаются рядом, чтобы быстрее принимать решения.",
  summaryTitle: "Чистая рабочая среда для управления обращениями",
  summaryDescription: "Приоритеты, карта и метрики читаются сразу после входа.",
  features: [
    "Очередь обращений и приоритеты",
    "Карта кластеров и статусы",
    "Аналитика по районам и нагрузке",
  ],
  overview: [
    {
      title: "Очередь",
      description: "Кластеры, приоритеты и переключение статусов.",
    },
    {
      title: "Карта",
      description: "Точки проблем и рабочий фокус по районам.",
    },
    {
      title: "Аналитика",
      description: "Главные метрики без перегруженных дашбордов.",
    },
  ],
  workflow: [
    "Откройте очередь и выделите важные обращения",
    "Проверьте географию проблем на карте кластеров",
    "Сверьте метрики и обновите рабочие статусы",
  ],
};

export const PUBLIC_ROLE_CONTENT: Record<PublicRoleKey, PublicRoleContent> = {
  citizen: citizenContent,
  admin: adminContent,
};

export function getPublicRoleContent(role: PublicRoleKey) {
  return PUBLIC_ROLE_CONTENT[role];
}

export function getPublicRoleLoginHref(role: PublicRoleKey) {
  return getLoginPathForRole(role);
}

export function getPublicRoleRegisterHref(role: PublicRoleKey) {
  return getRegisterPathForRole(role);
}
