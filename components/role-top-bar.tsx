"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { PanelTheme } from "@/lib/panel-theme";
import { getLoginPathForRole } from "@/lib/role-config";
import type { AccountRole } from "@/types";

type NavItem = {
  href: string;
  label: string;
};

type RoleTopBarProps = {
  role: AccountRole;
  userName: string;
  items: readonly NavItem[];
  theme: PanelTheme;
  onThemeChange: (theme: PanelTheme) => void;
  children: React.ReactNode;
};

function getSectionTitle(
  pathname: string,
  currentSearch: string,
  role: AccountRole,
  items: readonly NavItem[],
) {
  const match = items.find((item) => isNavItemActive(pathname, currentSearch, role, item.href));

  if (match) {
    return match.label;
  }

  return role === "citizen" ? "Кабинет" : "Панель";
}

const ROLE_SIDEBAR_META = {
  citizen: {
    brandCopy: "Городские обращения",
    roleName: "Гражданин",
    roleCopy: "Жалобы, рейтинг, профиль.",
    noteTitle: "Роль",
    noteCopy: "Личный кабинет.",
    chips: [] as string[],
  },
  admin: {
    brandCopy: "Панель оператора",
    roleName: "Админ",
    roleCopy: "Обращения, карта, логистика.",
    noteTitle: "Оператор",
    noteCopy: "Рабочий доступ.",
    chips: [] as string[],
  },
} as const;

export function RoleTopBar({
  role,
  userName,
  items,
  theme,
  onThemeChange,
  children,
}: RoleTopBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const nextTheme = theme === "light" ? "dark" : "light";
  const sectionTitle = getSectionTitle(pathname, currentSearch, role, items);
  const sidebarMeta = ROLE_SIDEBAR_META[role];
  const initials = (userName || (role === "citizen" ? "Гражданин" : "Админ"))
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || (role === "citizen" ? "Г" : "А");

  return (
    <div className="panel-frame">
      <aside
        className={`panel-sidebar-shell ${role === "admin" ? "panel-sidebar-shell-admin" : "panel-sidebar-shell-citizen"}`}
      >
        <div
          className={`panel-sidebar ${role === "admin" ? "panel-sidebar-card-admin" : "panel-sidebar-card-citizen"}`}
        >
          <div className={`flex items-start gap-3 ${role === "admin" ? "panel-sidebar-brand-admin" : ""}`}>
            <div className="portal-logo">
              <span className="portal-logo-mark">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="panel-title text-[1.9rem] leading-none">CityPulse</p>
              <p className="panel-copy mt-2 text-sm leading-6">{sidebarMeta.brandCopy}</p>
            </div>
          </div>

          <div className={`panel-role-summary ${role === "admin" ? "panel-role-summary-admin" : ""}`}>
            <span className="panel-role-badge">Роль</span>
            <p className="panel-role-name">{sidebarMeta.roleName}</p>
            <p className="panel-copy text-sm leading-6">{sidebarMeta.roleCopy}</p>
          </div>

          <div className={`grid gap-2 ${role === "admin" ? "panel-nav-group-admin" : ""}`}>
            <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Навигация</p>
            {items.map((item) => {
              const isActive = isNavItemActive(pathname, currentSearch, role, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive}
                  className={`panel-nav-link rounded-[1.15rem] px-3 py-3 text-sm font-medium transition ${role === "admin" ? "panel-nav-link-admin" : ""}`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] text-xs font-semibold ${role === "admin" ? "panel-nav-icon-admin" : ""}`}>
                    {item.label.slice(0, 1)}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className={`panel-muted-card rounded-[1.4rem] p-4 ${role === "admin" ? "panel-sidebar-note-admin" : ""}`}>
            <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">{sidebarMeta.noteTitle}</p>
            <p className="panel-section-title mt-3 text-lg font-semibold">{userName}</p>
            <p className="panel-copy mt-2 text-sm leading-6">{sidebarMeta.noteCopy}</p>
          </div>
        </div>
      </aside>

      <section className="panel-main-shell">
        <header className="panel-utilitybar">
          <div>
            <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">
              {role === "citizen" ? "Кабинет" : "Панель"}
            </p>
            <p className="panel-title mt-2 text-2xl">{sectionTitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="panel-theme-switch">
              <span className="panel-theme-switch-label" data-active={theme === "light"}>
                Светлая
              </span>
              <button
                type="button"
                aria-label={theme === "light" ? "Переключить на темную тему" : "Переключить на светлую тему"}
                onClick={() => onThemeChange(nextTheme)}
                className="panel-theme-switch-track"
                data-theme={theme}
              >
                <span className="panel-theme-switch-star panel-theme-switch-star-one" />
                <span className="panel-theme-switch-star panel-theme-switch-star-two" />
                <span className="panel-theme-switch-thumb" data-theme={theme} />
              </button>
              <span className="panel-theme-switch-label" data-active={theme === "dark"}>
                Темная
              </span>
            </div>

            <form action="/api/auth/logout" method="post">
              <input type="hidden" name="redirectTo" value={getLoginPathForRole(role)} />
              <button
                type="submit"
                className="panel-secondary-button rounded-full px-5 py-3 text-sm font-semibold transition"
              >
                Выйти
              </button>
            </form>
          </div>
        </header>

        <main className="panel-main">{children}</main>
      </section>
    </div>
  );
}

function isNavItemActive(
  pathname: string,
  currentSearch: string,
  role: AccountRole,
  href: string,
) {
  const [targetPath, queryString] = href.split("?");

  if (queryString) {
    return pathname === targetPath && currentSearch === queryString;
  }

  if (href === `/${role}` && pathname === href) {
    return currentSearch.length === 0;
  }

  return pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`));
}
