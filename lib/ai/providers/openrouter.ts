import { z } from "zod";

import { env } from "@/lib/env";
import type {
  AiProviderResult,
  ReportCategory,
  ReportDeepAnalysis,
} from "@/types";

const categorySchema = z.enum(["road", "light", "trash", "traffic", "other"]);
const visualSeveritySchema = z.enum(["low", "medium", "high"]);

const classificationSchema = z.object({
  is_valid_report: z.boolean(),
  suggested_category: categorySchema.optional(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).default([]),
  reason: z.string().min(1),
  visual_severity: visualSeveritySchema.optional(),
});

const deepAnalysisSchema = z.object({
  summary: z.string().min(1),
  observed_issue: z.string().min(1),
  visual_severity: visualSeveritySchema,
  urgency: z.string().min(1),
  safety_risk: z.string().min(1),
  recommended_action: z.string().min(1),
  evidence: z.array(z.string()).min(1),
});

type OpenRouterImageInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
};

type OpenRouterDeepAnalysisInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
  address: string | null;
};

export async function classifyWithOpenRouterProvider(
  input: OpenRouterImageInput,
): Promise<AiProviderResult | null> {
  const payload = await createOpenRouterImageJsonResponse({
    imageUrl: input.imageUrl,
    prompt: [
      "You validate citizen infrastructure complaints for a city operations dashboard.",
      "Look at the image and short complaint text.",
      "Return strict JSON only.",
      "All text fields in reason and tags must be in Russian.",
      "Allowed categories: road, light, trash, traffic, other.",
      "Set visual_severity based only on what is visible in the image.",
      "Mark is_valid_report false if the image does not show an outdoor city problem.",
      `Citizen category: ${input.userCategory}.`,
      `Citizen description: ${input.description || "Описание отсутствует."}`,
      "JSON shape:",
      '{"is_valid_report":true,"suggested_category":"road","confidence":0.91,"tags":["яма"],"reason":"На фото заметно повреждение дорожного покрытия","visual_severity":"high"}',
    ].join("\n"),
  });

  const parsed = classificationSchema.safeParse(payload);

  if (!parsed.success) {
    return null;
  }

  return {
    isValidReport: parsed.data.is_valid_report,
    suggestedCategory: parsed.data.suggested_category,
    confidence: parsed.data.confidence,
    tags: parsed.data.tags,
    reason: parsed.data.reason,
    visualSeverity: parsed.data.visual_severity,
  };
}

export async function analyzeWithOpenRouterProvider(
  input: OpenRouterDeepAnalysisInput,
): Promise<ReportDeepAnalysis | null> {
  const payload = await createOpenRouterImageJsonResponse({
    imageUrl: input.imageUrl,
    prompt: [
      "You are an expert municipal operations analyst for Almaty.",
      "Review the image and complaint text, then produce a concise but useful field report for an admin dashboard.",
      "Return strict JSON only.",
      "All textual fields must be in Russian.",
      "Use visual_severity from the image only: low, medium, or high.",
      `Citizen category: ${input.userCategory}.`,
      `Citizen description: ${input.description || "Описание отсутствует."}`,
      `Address: ${input.address ?? "Адрес неизвестен."}`,
      "JSON shape:",
      '{"summary":"Краткое резюме для оператора","observed_issue":"Что видно на фото","visual_severity":"high","urgency":"Почему проблему стоит приоритизировать","safety_risk":"Основной риск для жителей или движения","recommended_action":"Практическое действие для городской службы","evidence":["доказательство 1","доказательство 2"]}',
    ].join("\n"),
    detail: "high",
    maxOutputTokens: 700,
  });

  const parsed = deepAnalysisSchema.safeParse(payload);

  if (!parsed.success) {
    return null;
  }

  return {
    summary: parsed.data.summary,
    observedIssue: parsed.data.observed_issue,
    visualSeverity: parsed.data.visual_severity,
    urgency: parsed.data.urgency,
    safetyRisk: parsed.data.safety_risk,
    recommendedAction: parsed.data.recommended_action,
    evidence: parsed.data.evidence,
  };
}

type CreateOpenRouterImageJsonResponseInput = {
  imageUrl: string;
  prompt: string;
  detail?: "low" | "high" | "auto";
  maxOutputTokens?: number;
};

async function createOpenRouterImageJsonResponse({
  imageUrl,
  prompt,
  detail = "low",
  maxOutputTokens = 500,
}: CreateOpenRouterImageJsonResponseInput) {
  if (!env.openrouterApiKey) {
    return null;
  }

  try {
    const response = await fetch(`${env.openrouterBaseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openrouterApiKey}`,
        "HTTP-Referer": env.openrouterSiteUrl,
        "X-Title": env.openrouterAppName,
      },
      body: JSON.stringify({
        model: env.openrouterModel,
        max_output_tokens: maxOutputTokens,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              {
                type: "input_image",
                image_url: imageUrl,
                detail,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const text = extractResponseText(payload);

    if (!text) {
      return null;
    }

    return safeJsonParse(text);
  } catch {
    return null;
  }
}

function extractResponseText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const fragments: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? ((item as { content?: unknown[] }).content as unknown[])
      : [];

    for (const block of content) {
      if (!block || typeof block !== "object") {
        continue;
      }

      const typedBlock = block as { type?: string; text?: string };

      if (typedBlock.type === "output_text" && typeof typedBlock.text === "string") {
        fragments.push(typedBlock.text);
      }
    }
  }

  return fragments.length > 0 ? fragments.join("\n").trim() : null;
}

function safeJsonParse(text: string) {
  const normalized = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    return null;
  }
}
