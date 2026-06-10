import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSessionMock = vi.fn();
const getCurrentUserProfileMock = vi.fn();
const saveCurrentUserProfileMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentSession: getCurrentSessionMock,
}));

vi.mock("@/lib/profile-store", () => ({
  getCurrentUserProfile: getCurrentUserProfileMock,
  saveCurrentUserProfile: saveCurrentUserProfileMock,
}));

describe("profile route", () => {
  beforeEach(() => {
    vi.resetModules();
    getCurrentSessionMock.mockReset();
    getCurrentUserProfileMock.mockReset();
    saveCurrentUserProfileMock.mockReset();
  });

  it("returns 401 when there is no active session", async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/profile/route");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(getCurrentUserProfileMock).not.toHaveBeenCalled();
  });

  it("returns the current profile for the active user", async () => {
    getCurrentSessionMock.mockResolvedValue({
      id: "user-1",
      role: "citizen",
      email: "citizen@citypulse.local",
      fullName: "City Resident",
      isDemo: false,
    });
    getCurrentUserProfileMock.mockResolvedValue({
      role: "citizen",
      displayName: "City Resident",
      district: "Алмалинский",
      bio: "Keeps track of city issues.",
      avatarUrl: null,
      hasStoredProfile: true,
    });

    const { GET } = await import("@/app/api/profile/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.profile.displayName).toBe("City Resident");
  });

  it("persists a profile update and returns the saved shape", async () => {
    getCurrentSessionMock.mockResolvedValue({
      id: "user-1",
      role: "admin",
      email: "demo@citypulse.local",
      fullName: "Demo Admin",
      isDemo: false,
    });
    saveCurrentUserProfileMock.mockResolvedValue({
      role: "admin",
      displayName: "Demo Admin",
      district: "Бостандыкский",
      bio: "Coordinates operational queues.",
      avatarUrl: "https://cdn.citypulse.test/user-1/avatar.png",
      position: "Оператор смены",
      department: "Операторская служба",
      categories: ["road", "light"],
      hasStoredProfile: true,
    });

    const { PATCH } = await import("@/app/api/profile/route");
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: "Demo Admin",
          district: "Бостандыкский",
          bio: "Coordinates operational queues.",
          avatarUrl: "data:image/png;base64,aGVsbG8=",
          position: "Оператор смены",
          department: "Операторская служба",
          categories: ["road", "light"],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(saveCurrentUserProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", role: "admin" }),
      expect.objectContaining({
        displayName: "Demo Admin",
        categories: ["road", "light"],
      }),
    );
    expect(payload.profile.avatarUrl).toContain("https://cdn.citypulse.test/");
  });
});
