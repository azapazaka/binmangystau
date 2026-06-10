import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("OpenAI provider", () => {
  it("parses image classification responses from the OpenAI responses endpoint", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = "https://api.openai.com/v1";
    process.env.OPENAI_MODEL = "gpt-4.1-mini";

    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    is_valid_report: true,
                    suggested_category: "road",
                    confidence: 0.94,
                    tags: ["pothole", "asphalt_damage"],
                    reason: "Detected damaged road surface",
                    visual_severity: "high",
                  }),
                },
              ],
            },
          ],
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

    const classifyRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(classifyRequest.input[0].content[0].text).toContain("All text fields in reason and tags must be in Russian.");
  });

  it("parses deep analysis responses from the OpenAI responses endpoint", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = "https://api.openai.com/v1";
    process.env.OPENAI_MODEL = "gpt-4.1-mini";

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
