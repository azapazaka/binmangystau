import type { ReactNode } from "react";

import { Bell, ChevronDown, LogOut, Map, Recycle, Settings } from "lucide-react";
import { NavLink } from "react-router";

import { useAuth } from "@/contexts/AuthContext";

const ADMIN_NAV = [
  { label: "Карта и обращения", href: "/admin/map", icon: Map },
  { label: "Контейнеры", href: "/admin/waste", icon: Recycle },
  { label: "Настройки", href: "/admin/settings", icon: Settings },
];

function AdminBottomBar() {
  return (
    <nav aria-label="Навигация оператора" className="admin-shell-bottom-bar">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/admin/map"}
            className={({ isActive }) =>
              `admin-shell-bottom-link${isActive ? " is-active" : ""}`
            }
          >
            <span className="admin-shell-bottom-link-icon">
              <Icon size={18} />
            </span>
            <span className="admin-shell-bottom-link-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function AdminTopbar() {
  const { user, signOut } = useAuth();
  const name = user?.fullName?.trim() || "Оператор";

  return (
    <div className="admin-shell-topbar">
      <div className="admin-shell-topbar-filters">
        <div className="admin-shell-filter-pill">
          Все районы
          <ChevronDown size={12} className="text-slate-400" />
        </div>
        <div className="admin-shell-filter-pill">
          Все категории
          <ChevronDown size={12} className="text-slate-400" />
        </div>
      </div>

      <div className="admin-shell-topbar-actions">
        <button
          type="button"
          className="admin-shell-icon-button"
          aria-label="Уведомления"
        >
          <Bell size={16} />
          <span className="admin-shell-notification-dot" aria-hidden="true" />
        </button>

        <button type="button" className="admin-shell-profile-button">
          <span className="admin-shell-avatar" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="admin-shell-profile-copy">
            <span className="admin-shell-profile-name">{name}</span>
            <span className="admin-shell-profile-role">Администратор</span>
          </span>
        </button>

        <button
          type="button"
          onClick={signOut}
          className="admin-shell-logout-button"
          aria-label="Выйти"
        >
          <LogOut size={14} />
          Выйти
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { role: string; children: ReactNode }) {
  return (
    <div className="admin-shell-scene">
      <div className="admin-shell-frame">
        <div className="admin-shell-main">
          <AdminTopbar />
          <div className="admin-shell-content">{children}</div>
        </div>
        <AdminBottomBar />
      </div>
    </div>
  );
}

export { ADMIN_NAV };
