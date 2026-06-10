import { describe, expect, it } from "vitest";

import {
  getFallbackPanelThemeState,
  getDefaultPanelTheme,
  getPanelThemeStorageKey,
} from "@/lib/panel-theme";

describe("panel theme", () => {
  it("uses a dark default for admin and light default for citizen", () => {
    expect(getDefaultPanelTheme("admin")).toBe("dark");
    expect(getDefaultPanelTheme("citizen")).toBe("light");
  });

  it("builds a separate storage key for each panel role", () => {
    expect(getPanelThemeStorageKey("admin")).toBe("citypulse-panel-theme-admin");
    expect(getPanelThemeStorageKey("citizen")).toBe("citypulse-panel-theme-citizen");
  });

  it("provides a safe fallback theme state when no provider is available", () => {
    expect(getFallbackPanelThemeState()).toEqual({
      role: "citizen",
      theme: "light",
    });
    expect(getFallbackPanelThemeState("admin")).toEqual({
      role: "admin",
      theme: "dark",
    });
  });
});
