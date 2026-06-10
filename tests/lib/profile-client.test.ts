import { describe, expect, it } from "vitest";

describe("profile-client helpers", () => {
  it("builds a one-time migration payload only when the server profile does not exist yet", async () => {
    const { getPendingProfileMigration } = await import("@/lib/profile-client");

    const migration = getPendingProfileMigration({
      role: "citizen",
      rawLocalStorageValue: JSON.stringify({
        displayName: "Local Resident",
        district: "Алмалинский",
        bio: "Migrated from local storage",
        avatarDataUrl: "data:image/png;base64,aGVsbG8=",
      }),
      hasStoredProfile: false,
    });

    expect(migration).toMatchObject({
      role: "citizen",
      profile: {
        displayName: "Local Resident",
        district: "Алмалинский",
        bio: "Migrated from local storage",
        avatarUrl: "data:image/png;base64,aGVsbG8=",
      },
    });
  });

  it("skips migration when a server profile already exists", async () => {
    const { getPendingProfileMigration } = await import("@/lib/profile-client");

    const migration = getPendingProfileMigration({
      role: "admin",
      rawLocalStorageValue: JSON.stringify({
        displayName: "Local Admin",
        categories: ["road"],
      }),
      hasStoredProfile: true,
    });

    expect(migration).toBeNull();
  });
});
