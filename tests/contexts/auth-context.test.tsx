import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const {
  getSessionMock,
  onAuthStateChangeMock,
  signUpMock,
  signInWithPasswordMock,
  signOutMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signUpMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signUp: signUpMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
  },
}));

function Harness() {
  const auth = useAuth();
  const [result, setResult] = React.useState("");

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const value = await auth.registerCitizen({
            fullName: "Aigerim",
            email: "aigerim@example.com",
            password: "citypulse-demo",
          });
          setResult(JSON.stringify(value));
        }}
      >
        Register citizen
      </button>
      <div data-testid="result">{result}</div>
      <div data-testid="user">{auth.user?.email ?? "anonymous"}</div>
    </div>
  );
}

describe("AuthContext registration", () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    onAuthStateChangeMock.mockReset();
    signUpMock.mockReset();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();

    getSessionMock.mockResolvedValue({ data: { session: null } });
    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it("returns signed_in when registration yields an immediate session", async () => {
    signUpMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
            email: "aigerim@example.com",
            user_metadata: { role: "citizen", full_name: "Aigerim" },
          },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Register citizen" }));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent('"status":"signed_in"'),
    );
  });

  it("falls back to password sign-in when sign-up succeeds without a session", async () => {
    signUpMock.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });
    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-2",
            email: "aigerim@example.com",
            user_metadata: { role: "citizen", full_name: "Aigerim" },
          },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Register citizen" }));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent('"status":"signed_in"'),
    );
  });

  it("returns confirm_email when registration still requires email confirmation", async () => {
    signUpMock.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });
    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: null,
      },
      error: {
        message: "Email not confirmed",
      },
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Register citizen" }));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent('"status":"confirm_email"'),
    );
  });

  it("returns an error state when supabase rejects the registration", async () => {
    signUpMock.mockResolvedValue({
      data: {
        session: null,
      },
      error: {
        message: "User already registered",
      },
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Register citizen" }));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent('"status":"error"'),
    );
    expect(screen.getByTestId("result")).toHaveTextContent("User already registered");
  });
});
