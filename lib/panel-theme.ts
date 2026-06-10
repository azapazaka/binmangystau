import type { AccountRole } from "@/types";

export type PanelTheme = "light" | "dark";

export type PanelThemeState = {
  role: AccountRole;
  theme: PanelTheme;
};

export function getDefaultPanelTheme(role: AccountRole): PanelTheme {
  return role === "admin" ? "dark" : "light";
}

export function getPanelThemeStorageKey(role: AccountRole) {
  return `citypulse-panel-theme-${role}`;
}

export function getFallbackPanelThemeState(role: AccountRole = "citizen"): PanelThemeState {
  return {
    role,
    theme: getDefaultPanelTheme(role),
  };
}
