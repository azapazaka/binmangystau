"use client";

import { createContext, useContext } from "react";

import { getFallbackPanelThemeState, type PanelTheme } from "@/lib/panel-theme";
import type { AccountRole } from "@/types";

type PanelThemeContextValue = {
  role: AccountRole;
  theme: PanelTheme;
  setTheme: (theme: PanelTheme) => void;
};

export const PanelThemeContext = createContext<PanelThemeContextValue | null>(null);

export function usePanelTheme() {
  const context = useContext(PanelThemeContext);

  if (context) {
    return context;
  }

  const fallbackState = getFallbackPanelThemeState();

  return {
    ...fallbackState,
    setTheme: () => undefined,
  };
}
