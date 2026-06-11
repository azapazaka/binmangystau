import type { ComponentType } from "react";
import { FilePlus2, Files, UserCircle } from "lucide-react";
import { NavLink } from "react-router";

import { citizenCopy } from "@/components/citizen-v2/citizen-copy";
import { CityPulseLogo } from "@/components/icons";

const navIcons: Record<string, ComponentType<{ size?: number }>> = {
  "Новая заявка": FilePlus2,
  "Мои заявки": Files,
  "Проверка": Files,
  "Профиль": UserCircle,
};

export function CitizenSidebar() {
  return (
    <aside className="citizen-v2-sidebar">
      <div className="citizen-v2-brand">
        <CityPulseLogo size={34} />
        <div>
          <p className="citizen-v2-brand-title">CityPulse</p>
          <p className="citizen-v2-brand-city">{citizenCopy.cityName}</p>
        </div>
      </div>

      <nav aria-label="Навигация жителя" className="citizen-v2-nav">
        {citizenCopy.nav.map((item) => {
          const Icon = navIcons[item.label];

          return (
            <NavLink
              key={item.label}
              to={item.href}
              end
              className={({ isActive }) =>
                `citizen-v2-nav-link${isActive ? " is-active" : ""}`
              }
            >
              {Icon ? <Icon size={18} /> : null}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="citizen-v2-sidebar-card">
        <p className="citizen-v2-sidebar-card-title">Город становится лучше по шагам.</p>
        <p className="citizen-v2-sidebar-card-body">
          Отправляйте заявки, следите за статусом и помогайте подтверждать важные сигналы.
        </p>
      </div>
    </aside>
  );
}
