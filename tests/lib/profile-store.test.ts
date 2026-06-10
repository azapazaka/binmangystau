import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseAdminClientMock = vi.fn();

vi.mock("@/lib/env", () => ({
  env: {
    supabaseAvatarBucket: "avatars",
  },
  assertSupabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

function createProfileAdminClient() {
  const profileRow = {
    user_id: "user-1",
    display_name: "City Resident",
    district: "Алмалинский",
    bio: "Keeps track of city issues.",
    avatar_path: "user-1/avatar.png",
    position: null,
    department: null,
    categories: [],
    created_at: "2026-04-05T08:00:00.000Z",
    updated_at: "2026-04-05T08:00:00.000Z",
  };

  const authUpdateMock = vi.fn(async () => ({ data: {}, error: null }));
  const authGetUserByIdMock = vi.fn(async () => ({
    data: {
      user: {
        user_metadata: {
          role: "citizen",
        },
      },
    },
    error: null,
  }));
  const uploadMock = vi.fn(async () => ({ data: { path: "user-1/avatar.png" }, error: null }));

  return {
    from(table: string) {
      if (table !== "user_profiles") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select() {
          return {
            eq() {
              return {
                single: async () => ({ data: profileRow, error: null }),
              };
            },
          };
        },
        upsert: async (payload: Record<string, unknown>) => ({
          data: { ...profileRow, ...payload },
          error: null,
        }),
      };
    },
    storage: {
      from(bucket: string) {
        expect(bucket).toBe("avatars");

        return {
          upload: uploadMock,
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `https://cdn.citypulse.test/${path}`,
              },
            };
          },
        };
      },
    },
    auth: {
      admin: {
        getUserById: authGetUserByIdMock,
        updateUserById: authUpdateMock,
      },
    },
    authGetUserByIdMock,
    authUpdateMock,
    uploadMock,
  };
}

describe("profile-store", () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseAdminClientMock.mockReset();
  });

  it("loads the current user profile and exposes a public avatar URL", async () => {
    const admin = createProfileAdminClient();
    createSupabaseAdminClientMock.mockReturnValue(admin);

    const { getCurrentUserProfile } = await import("@/lib/profile-store");
    const profile = await getCurrentUserProfile({
      id: "user-1",
      role: "citizen",
      email: "citizen@citypulse.local",
      fullName: "City Resident",
      isDemo: false,
    });

    expect(profile).toMatchObject({
      role: "citizen",
      displayName: "City Resident",
      district: "Алмалинский",
      avatarUrl: "https://cdn.citypulse.test/user-1/avatar.png",
      hasStoredProfile: true,
    });
  });

  it("upserts the current profile, uploads avatar data URLs, and syncs auth metadata", async () => {
    const admin = createProfileAdminClient();
    createSupabaseAdminClientMock.mockReturnValue(admin);

    const { saveCurrentUserProfile } = await import("@/lib/profile-store");
    const profile = await saveCurrentUserProfile(
      {
        id: "user-1",
        role: "admin",
        email: "demo@citypulse.local",
        fullName: "Demo Admin",
        isDemo: false,
      },
      {
        displayName: "Demo Admin",
        district: "Бостандыкский",
        bio: "Coordinates operational queues.",
        avatarUrl: "data:image/png;base64,aGVsbG8=",
        position: "Оператор смены",
        department: "Операторская служба",
        categories: ["road", "light"],
      },
    );

    expect(profile).toMatchObject({
      role: "admin",
      position: "Оператор смены",
      department: "Операторская служба",
      categories: ["road", "light"],
    });
    expect(profile.avatarUrl).toContain("https://cdn.citypulse.test/user-1/");
    expect(admin.uploadMock).toHaveBeenCalledTimes(1);
    expect(admin.authUpdateMock).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        user_metadata: expect.objectContaining({
          full_name: "Demo Admin",
          role: "admin",
        }),
      }),
    );
  });
});
