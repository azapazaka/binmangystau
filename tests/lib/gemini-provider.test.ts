import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("Gemini provider", () => {
  it("parses image classification responses from Gemini generateContent", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "image/jpeg" }),
          arrayBuffer: async () => new TextEncoder().encode("image-bytes").buffer,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        is_valid_report: true,
                        suggested_category: "road",
                        confidence: 0.93,
                        tags: ["pothole", "road_damage"],
                        reason: "Detected damaged road surface",
                        visual_severity: "high",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        }),
    );

    const { classifyImageWithProvider } = await import("@/lib/ai/provider");

    const result = await classifyImageWithProvider({
      imageUrl: "https://example.com/report.jpg",
      userCategory: "road",
      description: "Large pothole on the avenue",
    });

    expect(result).toMatchObject({
      isValidReport: true,
      suggestedCategory: "road",
      visualSeverity: "high",
    });
  });

  it("parses deep analysis responses from Gemini generateContent", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "image/jpeg" }),
          arrayBuffer: async () => new TextEncoder().encode("image-bytes").buffer,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        summary: "Serious road damage near the curb.",
                        observed_issue: "A wide pothole is visible on the traffic lane.",
                        visual_severity: "high",
                        urgency: "Needs quick field inspection.",
                        safety_risk: "Drivers may damage wheels and lose control.",
                        recommended_action: "Send road maintenance crew for urgent patching.",
                        evidence: ["pothole", "lane_damage"],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        }),
    );

    const { analyzeReportWithProvider } = await import("@/lib/ai/provider");

    const result = await analyzeReportWithProvider({
      imageUrl: "https://example.com/report.jpg",
      userCategory: "road",
      description: "Deep pothole near the curb",
      address: "Абая 10",
      aiReason: "Detected damaged road surface",
      aiVisualSeverity: "high",
      aiTags: ["pothole"],
    });

    expect(result).toMatchObject({
      visualSeverity: "high",
      recommendedAction: "Send road maintenance crew for urgent patching.",
    });
  });

  it("maps Gemini 'none' severity to a safe low fallback", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "image/jpeg" }),
          arrayBuffer: async () => new TextEncoder().encode("image-bytes").buffer,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        is_valid_report: false,
                        suggested_category: "other",
                        confidence: 0.99,
                        tags: [],
                        reason: "Image is not a city issue report",
                        visual_severity: "none",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        }),
    );

    const { classifyImageWithProvider } = await import("@/lib/ai/provider");

    const result = await classifyImageWithProvider({
      imageUrl: "https://example.com/report.jpg",
      userCategory: "road",
      description: "This should be rejected",
    });

    expect(result).toMatchObject({
      isValidReport: false,
      visualSeverity: "low",
    });
  });
});
