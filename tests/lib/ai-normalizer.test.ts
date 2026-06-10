import { describe, expect, it } from "vitest";

import { normalizeAiClassification } from "@/lib/ai/normalize";

describe("normalizeAiClassification", () => {
  it("marks matching confident AI results as valid without review", () => {
    expect(
      normalizeAiClassification({
        userCategory: "road",
        providerResult: {
          isValidReport: true,
          suggestedCategory: "road",
          confidence: 0.91,
          tags: ["pothole"],
          reason: "Detected damaged road surface",
        },
      }),
    ).toMatchObject({
      aiCategory: "road",
      aiValidationStatus: "valid",
      aiNeedsReview: false,
    });
  });

  it("flags mismatched categories for review", () => {
    expect(
      normalizeAiClassification({
        userCategory: "trash",
        providerResult: {
          isValidReport: true,
          suggestedCategory: "road",
          confidence: 0.92,
          tags: ["road", "pothole"],
          reason: "Looks like asphalt damage",
        },
      }),
    ).toMatchObject({
      aiCategory: "road",
      aiValidationStatus: "uncertain",
      aiNeedsReview: true,
    });
  });

  it("flags invalid reports for review while preserving the reason", () => {
    expect(
      normalizeAiClassification({
        userCategory: "other",
        providerResult: {
          isValidReport: false,
          confidence: 0.89,
          tags: ["indoor"],
          reason: "Photo does not show city infrastructure",
        },
      }),
    ).toMatchObject({
      aiValidationStatus: "invalid",
      aiNeedsReview: true,
      aiReason: "Photo does not show city infrastructure",
    });
  });

  it("falls back to unavailable when the provider result is missing", () => {
    expect(
      normalizeAiClassification({
        userCategory: "light",
        providerResult: null,
      }),
    ).toMatchObject({
      aiCategory: null,
      aiValidationStatus: "unavailable",
      aiNeedsReview: false,
    });
  });
});
