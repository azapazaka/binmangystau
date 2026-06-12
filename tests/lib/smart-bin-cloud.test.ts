import { describe, expect, it, vi } from "vitest";

import { pushSmartBinCloudState } from "@/lib/smartBinCloud";

const payload = {
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
  lastParsedFormat: "sensor_log" as const,
};

describe("smartBin cloud uploader", () => {
  it("returns a non-throwing error result when upload fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("Network down"));

    await expect(
      pushSmartBinCloudState({
        fetchImpl,
        pushUrl: "https://example.com/api/smart-bin/push",
        pushToken: "secret",
        payload,
      }),
    ).resolves.toMatchObject({
      attempted: true,
      ok: false,
      error: "Network down",
    });
  });

  it("does not attempt upload when push env is missing", async () => {
    const fetchImpl = vi.fn();
    const result = await pushSmartBinCloudState({
      fetchImpl,
      pushUrl: null,
      pushToken: null,
      payload,
    });

    expect(result).toEqual({
      attempted: false,
      ok: false,
      pushedAt: null,
      error: null,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
