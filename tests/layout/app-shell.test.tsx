import React from "react";
import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/AppShell";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      fullName: "Демо-администратор",
      role: "admin",
    },
    signOut: vi.fn(),
  }),
}));

describe("AppShell admin layout", () => {
  it("uses dedicated admin shell classes instead of citizen shell classes", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/map"]}>
        <AppShell role="admin">
          <div>Admin content</div>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(container.querySelector(".admin-shell-frame")).toBeTruthy();
    expect(container.querySelector(".admin-shell-sidebar")).toBeTruthy();
    expect(container.querySelector(".admin-shell-topbar")).toBeTruthy();
    expect(container.querySelector(".citizen-v2-sidebar")).toBeNull();
  });
});
