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
  it("uses a dedicated admin bottom bar instead of a sidebar", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/map"]}>
        <AppShell role="admin">
          <div>Admin content</div>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(container.querySelector(".admin-shell-frame")).toBeTruthy();
    expect(container.querySelector(".admin-shell-topbar")).toBeTruthy();
    expect(container.querySelector(".admin-shell-bottom-bar")).toBeTruthy();
    expect(container.querySelector(".admin-shell-sidebar")).toBeNull();
  });
});
