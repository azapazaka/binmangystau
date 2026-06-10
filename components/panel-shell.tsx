"use client";

import { useEffect, useRef, useState } from "react";

import {
  getDefaultPanelTheme,
  getPanelThemeStorageKey,
  type PanelTheme,
} from "@/lib/panel-theme";
import type { AccountRole } from "@/types";

import { PanelThemeContext } from "./panel-theme-context";
import { RoleTopBar } from "./role-top-bar";

type NavItem = {
  href: string;
  label: string;
};

type PanelShellProps = {
  role: AccountRole;
  userName: string;
  items: readonly NavItem[];
  children: React.ReactNode;
};

export function PanelShell({ role, userName, items, children }: PanelShellProps) {
  const fallbackTheme = getDefaultPanelTheme(role);
  const hasLoadedStoredTheme = useRef(false);
  const [theme, setTheme] = useState<PanelTheme>(fallbackTheme);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const savedTheme = window.localStorage.getItem(getPanelThemeStorageKey(role));

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else {
        setTheme(fallbackTheme);
      }

      hasLoadedStoredTheme.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [fallbackTheme, role]);

  useEffect(() => {
    if (!hasLoadedStoredTheme.current) {
      return;
    }

    window.localStorage.setItem(getPanelThemeStorageKey(role), theme);
  }, [role, theme]);

  useEffect(() => {
    document.body.classList.add("panel-mode-active");
    document.body.dataset.panelTheme = theme;
    document.body.dataset.panelRole = role;

    return () => {
      document.body.classList.remove("panel-mode-active");
      delete document.body.dataset.panelTheme;
      delete document.body.dataset.panelRole;
    };
  }, [role, theme]);

  return (
    <PanelThemeContext.Provider value={{ role, theme, setTheme }}>
      <div className="panel-theme" data-panel-role={role} data-panel-theme={theme}>
        <RoleTopBar
          role={role}
          userName={userName}
          items={items}
          theme={theme}
          onThemeChange={setTheme}
        >
          {children}
        </RoleTopBar>
      </div>
    </PanelThemeContext.Provider>
  );
}
