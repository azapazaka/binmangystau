import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("OpenRouter provider", () => {
  it("parses image classification responses through the OpenRouter responses endpoint", async () => {
    process.env.AI_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
    process.env.OPENROUTER_MODEL = "openai/gpt-4.1-mini";
    process.env.OPENROUTER_SITE_URL = "https://citypulse.local";
    process.env.OPENROUTER_APP_NAME = "CityPulse";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          is_valid_report: true,
          suggested_category: "road",
          confidence: 0.91,
          tags: ["pothole", "road_damage"],
          reason: "Detected damaged road surface",
          visual_severity: "high",
        }),
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

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
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-openrouter-key",
          "HTTP-Referer": "https://citypulse.local",
          "X-Title": "CityPulse",
        }),
      }),
    );

    const classifyRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(classifyRequest.input[0].content[0].text).toContain("All text fields in reason and tags must be in Russian.");
  });

  it("parses deep analysis responses through OpenRouter", async () => {
    process.env.AI_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
    process.env.OPENROUTER_MODEL = "openai/gpt-4.1-mini";

    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            summary: "Serious road damage near the curb.",
            observed_issue: "A wide pothole is visible on the traffic lane.",
            visual_severity: "high",
            urgency: "Needs quick field inspection.",
            safety_risk: "Drivers may damage wheels and lose control.",
            recommended_action: "Send road maintenance crew for urgent patching.",
            evidence: ["pothole", "lane_damage"],
          }),
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

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

    const analysisRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(analysisRequest.input[0].content[0].text).toContain("All textual fields must be in Russian.");
  });
});
