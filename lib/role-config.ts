import type { AccountRole } from "@/types";

export const CITIZEN_NAV_ITEMS = [
  { href: "/citizen", label: "Главная" },
  { href: "/citizen/profile", label: "Профиль" },
  { href: "/citizen/report", label: "Создать жалобу" },
  { href: "/citizen/verify", label: "Проверка жалоб" },
  { href: "/citizen/my-reports", label: "Мои жалобы" },
  { href: "/citizen/rating", label: "Рейтинг" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/profile", label: "Профиль" },
  { href: "/admin?tab=reports", label: "Обращения" },
  { href: "/admin?tab=map", label: "IoT карта" },
  { href: "/admin?tab=analytics", label: "Логистика" },
] as const;

export function getDefaultAreaPath(role: AccountRole) {
  return role === "citizen" ? "/citizen" : "/admin";
}

export function getLoginPathForRole(role: AccountRole) {
  return role === "citizen" ? "/auth/citizen/login" : "/auth/admin/login";
}

export function getRegisterPathForRole(role: AccountRole) {
  return role === "citizen" ? "/auth/citizen/register" : "/auth/admin/register";
}
