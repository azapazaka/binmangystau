import { afterEach, describe, expect, it, vi } from "vitest";

const FALLBACK_TOKEN = "";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("env", () => {
  it("uses the empty fallback token when no env variable is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");

    const { env } = await import("@/lib/env");

    expect(env.mapboxToken).toBe(FALLBACK_TOKEN);
  });

  it("prefers the explicit Mapbox token from environment variables", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "custom-public-token");

    const { env } = await import("@/lib/env");

    expect(env.mapboxToken).toBe("custom-public-token");
  });

  it("throws when required Supabase environment variables are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const { assertSupabaseConfigured } = await import("@/lib/env");

    expect(() => assertSupabaseConfigured()).toThrow(
      "Missing required Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("returns the required Supabase config, including the avatar bucket", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("SUPABASE_AVATAR_BUCKET", "avatars");

    const { getRequiredSupabaseConfig } = await import("@/lib/env");

    expect(getRequiredSupabaseConfig()).toEqual({
      url: "https://project.supabase.co",
      anonKey: "anon-key",
      serviceRoleKey: "service-role-key",
      avatarBucket: "avatars",
      reportsBucket: "reports",
    });
  });
});
