import { z } from "zod";

import { env } from "@/lib/env";
import type {
  AiProviderResult,
  AiVisualSeverity,
  ReportCategory,
  ReportDeepAnalysis,
} from "@/types";

const categorySchema = z.enum(["road", "light", "trash", "traffic", "other"]);
const visualSeveritySchema = z.enum(["low", "medium", "high", "none"]);

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

type GeminiImageInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
};

type GeminiDeepAnalysisInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
  address: string | null;
};

export async function classifyWithGeminiProvider(
  input: GeminiImageInput,
): Promise<AiProviderResult | null> {
  const payload = await createGeminiImageJsonResponse({
    imageUrl: input.imageUrl,
    prompt: [
      "Ты валидируешь обращения жителей для городской панели Алматы.",
      "Проанализируй изображение и текст жалобы вместе.",
      "Верни только JSON без markdown.",
      "Все текстовые поля reason и tags должны быть на русском языке.",
      "Допустимые категории: road, light, trash, traffic, other.",
      "Поле visual_severity определяй только по тому, что реально видно на фото.",
      "Если фото не относится к городской инфраструктурной проблеме на улице, установи is_valid_report=false.",
      `Категория, выбранная жителем: ${input.userCategory}.`,
      `Описание жителя: ${input.description || "Описание отсутствует."}`,
      "JSON shape:",
      '{"is_valid_report":true,"suggested_category":"road","confidence":0.91,"tags":["яма","повреждение_дороги"],"reason":"На фото заметно повреждение дорожного покрытия.","visual_severity":"high"}',
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
    visualSeverity: normalizeVisualSeverity(parsed.data.visual_severity),
  };
}

export async function analyzeWithGeminiProvider(
  input: GeminiDeepAnalysisInput,
): Promise<ReportDeepAnalysis | null> {
  const payload = await createGeminiImageJsonResponse({
    imageUrl: input.imageUrl,
    prompt: [
      "Ты эксперт по городским обращениям для панели акимата Алматы.",
      "Проанализируй фото и текст жалобы и сформируй практичный отчёт для администратора.",
      "Верни только JSON без markdown.",
      "Все текстовые поля должны быть на русском языке.",
      "Используй visual_severity только по изображению: low, medium или high.",
      `Категория жителя: ${input.userCategory}.`,
      `Описание жителя: ${input.description || "Описание отсутствует."}`,
      `Адрес: ${input.address ?? "Адрес неизвестен."}`,
      "JSON shape:",
      '{"summary":"Краткое резюме для оператора","observed_issue":"Что видно на фото","visual_severity":"high","urgency":"Почему проблему стоит приоритизировать","safety_risk":"Основной риск для жителей или движения","recommended_action":"Практическое действие для городской службы","evidence":["доказательство 1","доказательство 2"]}',
    ].join("\n"),
    maxOutputTokens: 900,
  });

  const parsed = deepAnalysisSchema.safeParse(payload);

  if (!parsed.success) {
    return null;
  }

  return {
    summary: parsed.data.summary,
    observedIssue: parsed.data.observed_issue,
    visualSeverity: normalizeVisualSeverity(parsed.data.visual_severity),
    urgency: parsed.data.urgency,
    safetyRisk: parsed.data.safety_risk,
    recommendedAction: parsed.data.recommended_action,
    evidence: parsed.data.evidence,
  };
}

type CreateGeminiImageJsonResponseInput = {
  imageUrl: string;
  prompt: string;
  maxOutputTokens?: number;
};

async function createGeminiImageJsonResponse({
  imageUrl,
  prompt,
  maxOutputTokens = 700,
}: CreateGeminiImageJsonResponseInput) {
  if (!env.geminiApiKey) {
    return null;
  }

  const inlineImage = await buildInlineImage(imageUrl);

  if (!inlineImage) {
    return null;
  }

  try {
    const response = await fetch(
      `${env.geminiBaseUrl}/models/${env.geminiModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.geminiApiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "Respond with valid JSON only. Do not wrap the result in markdown fences.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: inlineImage.mimeType,
                    data: inlineImage.base64Data,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const text = extractGeminiText(payload);

    if (!text) {
      return null;
    }

    return safeJsonParse(text);
  } catch {
    return null;
  }
}

async function buildInlineImage(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    return parseDataUrl(imageUrl);
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const bytes = await response.arrayBuffer();

  return {
    mimeType: contentType,
    base64Data: Buffer.from(bytes).toString("base64"),
  };
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

function extractGeminiText(payload: Record<string, unknown>) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const content = (candidate as { content?: unknown }).content;

    if (!content || typeof content !== "object") {
      continue;
    }

    const parts = Array.isArray((content as { parts?: unknown[] }).parts)
      ? ((content as { parts?: unknown[] }).parts as unknown[])
      : [];

    const fragments: string[] = [];

    for (const part of parts) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = (part as { text?: unknown }).text;

      if (typeof text === "string" && text.trim()) {
        fragments.push(text);
      }
    }

    if (fragments.length > 0) {
      return fragments.join("\n").trim();
    }
  }

  return null;
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

function normalizeVisualSeverity(
  value: z.infer<typeof visualSeveritySchema> | undefined,
): AiVisualSeverity {
  if (value === "medium" || value === "high") {
    return value;
  }

  return "low";
}
