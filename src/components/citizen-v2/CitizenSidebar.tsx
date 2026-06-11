import type { ComponentType } from "react";
import { FilePlus2, Files, ShieldCheck, UserCircle } from "lucide-react";
import { NavLink } from "react-router";

import { citizenCopy } from "@/components/citizen-v2/citizen-copy";

const navIcons: Record<string, ComponentType<{ size?: number }>> = {
  "Новая заявка": FilePlus2,
  "Мои заявки": Files,
  "Проверка": ShieldCheck,
  "Профиль": UserCircle,
};

export function CitizenSidebar() {
  return (
    <nav aria-label="Навигация жителя" className="citizen-v2-bottom-bar">
      {citizenCopy.nav.map((item) => {
        const Icon = navIcons[item.label];

        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/citizen/report"}
            className={({ isActive }) =>
              `citizen-v2-bottom-link${isActive ? " is-active" : ""}`
            }
          >
            <span className="citizen-v2-bottom-link-icon">
              {Icon ? <Icon size={18} /> : null}
            </span>
            <span className="citizen-v2-bottom-link-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
