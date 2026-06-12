import { afterEach, describe, expect, it, vi } from "vitest";

describe("smartBin source resolver", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to bridge on localhost", async () => {
    const { resolveDefaultSmartBinRuntimeSource } = await import(
      "@/lib/smartBinSource"
    );

    expect(resolveDefaultSmartBinRuntimeSource("localhost")).toBe("bridge");
  });

  it("defaults to legacy outside localhost", async () => {
    const { resolveDefaultSmartBinRuntimeSource } = await import(
      "@/lib/smartBinSource"
    );

    expect(resolveDefaultSmartBinRuntimeSource("aka.vercel.app")).toBe("legacy");
  });

  it("uses the configured cloud source and cloud url", async () => {
    vi.stubEnv("VITE_SMART_BIN_SOURCE", "cloud");
    vi.stubEnv("VITE_SMART_BIN_CLOUD_URL", "/api/smart-bin/live");

    const { getSmartBinLiveUrl, resolveSmartBinRuntimeSource } = await import(
      "@/lib/smartBinSource"
    );

    expect(resolveSmartBinRuntimeSource("localhost")).toBe("cloud");
    expect(getSmartBinLiveUrl("cloud")).toBe("/api/smart-bin/live");
  });

  it("defaults to cloud on vercel preview hostnames", async () => {
    const { resolveDefaultSmartBinRuntimeSource } = await import(
      "@/lib/smartBinSource"
    );

    expect(
      resolveDefaultSmartBinRuntimeSource("aka-git-smart-bin-azapazaka.vercel.app"),
    ).toBe("cloud");
  });
});
