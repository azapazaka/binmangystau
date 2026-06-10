import type {
  AiProviderResult,
  NormalizedAiClassification,
  ReportCategory,
} from "@/types";

type NormalizeAiClassificationInput = {
  userCategory: ReportCategory;
  providerResult: AiProviderResult | null;
};

export function normalizeAiClassification({
  userCategory,
  providerResult,
}: NormalizeAiClassificationInput): NormalizedAiClassification {
  if (!providerResult) {
    return {
      aiCategory: null,
      aiConfidence: null,
      aiTags: [],
      aiValidationStatus: "unavailable",
      aiNeedsReview: false,
      aiReason: null,
      aiVisualSeverity: null,
    };
  }

  if (!providerResult.isValidReport) {
    return {
      aiCategory: providerResult.suggestedCategory ?? null,
      aiConfidence: providerResult.confidence,
      aiTags: providerResult.tags,
      aiValidationStatus: "invalid",
      aiNeedsReview: true,
      aiReason: providerResult.reason,
      aiVisualSeverity: providerResult.visualSeverity ?? null,
    };
  }

  const isMismatch =
    providerResult.suggestedCategory && providerResult.suggestedCategory !== userCategory;

  if (isMismatch) {
    return {
      aiCategory: providerResult.suggestedCategory ?? null,
      aiConfidence: providerResult.confidence,
      aiTags: providerResult.tags,
      aiValidationStatus: "uncertain",
      aiNeedsReview: true,
      aiReason: providerResult.reason,
      aiVisualSeverity: providerResult.visualSeverity ?? null,
    };
  }

  return {
    aiCategory: providerResult.suggestedCategory ?? userCategory,
    aiConfidence: providerResult.confidence,
    aiTags: providerResult.tags,
    aiValidationStatus: "valid",
    aiNeedsReview: false,
    aiReason: providerResult.reason,
    aiVisualSeverity: providerResult.visualSeverity ?? null,
  };
}
