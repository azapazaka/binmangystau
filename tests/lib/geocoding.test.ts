import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("geocoding", () => {
  it("forward geocodes manual addresses without forcing Almaty into the query", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [51.1694, 43.6511] },
            properties: {
              full_address: "15-й микрорайон, Актау, Мангистауская область, Казахстан",
              context: {
                district: {
                  name: "Актау",
                },
              },
            },
          },
        ],
      }),
    });

    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "test-public-token");
    vi.stubGlobal("fetch", fetchMock);

    const { forwardGeocode } = await import("@/lib/geocoding");
    const result = await forwardGeocode("15-й микрорайон, Актау");

    const requestUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");

    expect(decodeURIComponent(requestUrl)).toContain("15-й микрорайон, Актау");
    expect(decodeURIComponent(requestUrl)).toContain("Казахстан");
    expect(decodeURIComponent(requestUrl)).not.toContain("Алматы");
    expect(requestUrl).toContain("country=KZ");
    expect(result.address).toContain("Актау");
    expect(result.district).toBe("Актау");
  });

  it("reverse geocodes coordinates with longitude and latitude query parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              full_address: "проспект Абая, 159, Алматы, Казахстан",
              context: {
                district: {
                  name: "Алматы",
                },
              },
            },
          },
        ],
      }),
    });

    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "test-public-token");
    vi.stubGlobal("fetch", fetchMock);

    const { reverseGeocode } = await import("@/lib/geocoding");
    const result = await reverseGeocode(43.238949, 76.889709);

    const requestUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");

    expect(requestUrl).toContain("longitude=76.889709");
    expect(requestUrl).toContain("latitude=43.238949");
    expect(requestUrl).not.toContain("?q=76.889709,43.238949");
    expect(result.address).toBe("проспект Абая, 159, Алматы, Казахстан");
    expect(result.district).toBe("Алматы");
  });

  it("falls back to a neutral nationwide location when reverse geocoding fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "test-public-token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));

    const { reverseGeocode } = await import("@/lib/geocoding");
    const result = await reverseGeocode(51.1282, 71.4304);

    expect(result.address).toBe("Локация уточняется");
    expect(result.district).toBeNull();
    expect(result.zoneKey).toBe("nationwide");
    expect(result.zoneCoefficient).toBe(1);
  });
});
