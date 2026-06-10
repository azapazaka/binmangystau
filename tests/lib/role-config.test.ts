import { describe, expect, it } from "vitest";

import {
  ADMIN_NAV_ITEMS,
  CITIZEN_NAV_ITEMS,
  getDefaultAreaPath,
  getLoginPathForRole,
  getRegisterPathForRole,
} from "@/lib/role-config";

describe("role config", () => {
  it("returns fixed area redirects for each role", () => {
    expect(getDefaultAreaPath("citizen")).toBe("/citizen");
    expect(getDefaultAreaPath("admin")).toBe("/admin");
  });

  it("exposes role-specific auth routes", () => {
    expect(getLoginPathForRole("citizen")).toBe("/auth/citizen/login");
    expect(getRegisterPathForRole("citizen")).toBe("/auth/citizen/register");
    expect(getLoginPathForRole("admin")).toBe("/auth/admin/login");
    expect(getRegisterPathForRole("admin")).toBe("/auth/admin/register");
  });

  it("defines a dedicated top bar for citizens", () => {
    expect(CITIZEN_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/citizen",
      "/citizen/profile",
      "/citizen/report",
      "/citizen/verify",
      "/citizen/my-reports",
      "/citizen/rating",
    ]);
  });

  it("defines a dedicated top bar for admins", () => {
    expect(ADMIN_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/admin",
      "/admin/profile",
      "/admin/reports",
      "/admin/map",
      "/admin/analytics",
    ]);
  });
});
