import { describe, expect, it } from "vitest";

import {
  calculateFillLevel,
  createEmptyBridgeResponse,
  getSmartBinMaxFillLevel,
  getSmartBinOverallStatus,
  mergeSmartBinBridgeResponses,
  resolveSmartBinPosition,
} from "@/lib/smartBin";
import { createOfflineSmartBinBridgeResponse } from "@/lib/smartBinBridge";

describe("smartBin helpers", () => {
  it("calculates fill level from a 15 cm bin height", () => {
    expect(calculateFillLevel(4)).toBe(73);
    expect(calculateFillLevel(15)).toBe(0);
  });

  it("clamps fill level into the 0..100 range", () => {
    expect(calculateFillLevel(-2)).toBe(100);
    expect(calculateFillLevel(18)).toBe(0);
  });

  it("picks the highest live status across the two sections", () => {
    expect(
      getSmartBinOverallStatus({
        plastic: { status: "warning", isOffline: false },
        organic: { status: "full", isOffline: false },
      }),
    ).toBe("full");
  });

  it("keeps the max fill level for the map marker", () => {
    expect(
      getSmartBinMaxFillLevel({
        plastic: { fillLevel: 73 },
        organic: { fillLevel: 40 },
      }),
    ).toBe(73);
  });

  it("falls back to stored and then default coordinates", () => {
    expect(
      resolveSmartBinPosition({
        browserPosition: { lat: 43.6, lng: 51.1 },
        storedPosition: { lat: 43.5, lng: 51.0, source: "stored" },
        fallbackPosition: { lat: 43.4, lng: 50.9 },
      }),
    ).toEqual({ lat: 43.6, lng: 51.1, source: "browser" });

    expect(
      resolveSmartBinPosition({
        storedPosition: { lat: 43.5, lng: 51.0, source: "stored" },
        fallbackPosition: { lat: 43.4, lng: 50.9 },
      }),
    ).toEqual({ lat: 43.5, lng: 51.0, source: "stored" });

    expect(
      resolveSmartBinPosition({
        fallbackPosition: { lat: 43.4, lng: 50.9 },
      }),
    ).toEqual({ lat: 43.4, lng: 50.9, source: "default" });
  });

  it("preserves previous readings when the next payload is offline", () => {
    const previous = {
      ok: true,
      readAt: "2026-06-11T12:00:00.000Z",
      sections: {
        plastic: {
          distanceCm: 4,
          fillLevel: 73,
          status: "warning" as const,
          isOffline: false,
          lastReadAt: "2026-06-11T12:00:00.000Z",
        },
        organic: {
          distanceCm: 9,
          fillLevel: 40,
          status: "normal" as const,
          isOffline: false,
          lastReadAt: "2026-06-11T12:00:00.000Z",
        },
      },
      error: null,
    };

    const merged = mergeSmartBinBridgeResponses(
      previous,
      createOfflineSmartBinBridgeResponse({
        error: "Bridge offline",
        previousSections: createEmptyBridgeResponse().sections,
      }),
    );

    expect(merged.sections.plastic.fillLevel).toBe(73);
    expect(merged.sections.plastic.status).toBe("offline");
    expect(merged.sections.organic.fillLevel).toBe(40);
    expect(merged.sections.organic.status).toBe("offline");
  });
});
