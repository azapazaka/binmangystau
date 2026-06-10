import type { ComponentType } from "react";
import {
  Bell,
  FilePlus2,
  Files,
  Home,
  Map,
  Settings,
  UserCircle,
} from "lucide-react";
import { NavLink } from "react-router";

import { citizenCopy } from "@/components/citizen-v2/citizen-copy";
import { CityPulseLogo } from "@/components/icons";

const navIcons: Record<string, ComponentType<{ size?: number }>> = {
  Home,
  Map,
  "New Report": FilePlus2,
  "My Reports": Files,
  Notify: Bell,
  Profile: UserCircle,
  Settings,
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

      <nav aria-label="Citizen navigation" className="citizen-v2-nav">
        {citizenCopy.nav.map((item) => {
          const Icon = navIcons[item.label];

          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === "/citizen"}
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
        <p className="citizen-v2-sidebar-card-title">Together, we build a better Aktau.</p>
        <p className="citizen-v2-sidebar-card-body">
          Report local issues, track progress, and help verify what matters in your area.
        </p>
      </div>
    </aside>
  );
}
