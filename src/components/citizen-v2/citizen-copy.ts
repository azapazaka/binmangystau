export const citizenCopy = {
  cityName: "Актау",
  overviewTitle: "Городские обращения",
  overviewSubtitle:
    "Смотрите, что происходит рядом, и помогайте службам реагировать быстрее.",
  reportAction: "+ Новая заявка",
  nav: [
    { label: "Главная", href: "/citizen" },
    { label: "Карта", href: "/citizen/map" },
    { label: "Новая заявка", href: "/citizen/report" },
    { label: "Мои заявки", href: "/citizen/my-reports" },
    { label: "Проверка", href: "/citizen/verify" },
    { label: "Профиль", href: "/citizen/profile" },
    { label: "Настройки", href: "/citizen/settings" },
  ],
} as const;
