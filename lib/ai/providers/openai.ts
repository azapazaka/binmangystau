import { z } from "zod";

import { env } from "@/lib/env";
import type {
  AiProviderResult,
  AiVisualSeverity,
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

type OpenAiImageInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
};

type OpenAiDeepAnalysisInput = {
  imageUrl: string;
  userCategory: ReportCategory;
  description: string;
  address: string | null;
};

export async function classifyWithOpenAiProvider(
  input: OpenAiImageInput,
): Promise<AiProviderResult | null> {
  const payload = await createOpenAiImageJsonResponse({
    imageUrl: input.imageUrl,
    prompt: [
      "You validate citizen infrastructure complaints for a city operations dashboard in Almaty.",
      "Look at the image and the short complaint text together.",
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

export async function analyzeWithOpenAiProvider(
  input: OpenAiDeepAnalysisInput,
): Promise<ReportDeepAnalysis | null> {
  const payload = await createOpenAiImageJsonResponse({
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

type CreateOpenAiImageJsonResponseInput = {
  imageUrl: string;
  prompt: string;
  detail?: "low" | "high" | "auto";
  maxOutputTokens?: number;
};

async function createOpenAiImageJsonResponse({
  imageUrl,
  prompt,
  detail = "low",
  maxOutputTokens = 500,
}: CreateOpenAiImageJsonResponseInput) {
  if (!env.openaiApiKey) {
    return null;
  }

  try {
    const response = await fetch(`${env.openaiBaseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
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

export function buildFallbackDeepAnalysis(input: {
  userCategory: ReportCategory;
  description: string;
  aiReason: string | null;
  aiVisualSeverity: AiVisualSeverity | null;
  address: string | null;
  aiTags: string[];
}): ReportDeepAnalysis {
  const visualSeverity = input.aiVisualSeverity ?? inferVisualSeverity(input.userCategory);
  const tags = input.aiTags.length > 0 ? input.aiTags : [input.userCategory];
  const summaryParts = [
    input.aiReason ?? fallbackReason(input.userCategory),
    input.description ? `Комментарий жителя: ${input.description}` : null,
  ].filter(Boolean);

  return {
    summary: summaryParts.join(" "),
    observedIssue:
      input.description || fallbackObservedIssue(input.userCategory, input.address),
    visualSeverity,
    urgency: fallbackUrgency(visualSeverity),
    safetyRisk: fallbackSafetyRisk(input.userCategory, visualSeverity),
    recommendedAction: fallbackRecommendedAction(input.userCategory, visualSeverity),
    evidence: tags.slice(0, 4),
  };
}

function inferVisualSeverity(category: ReportCategory): AiVisualSeverity {
  if (category === "road" || category === "traffic") {
    return "high";
  }

  if (category === "light") {
    return "medium";
  }

  return "low";
}

function fallbackReason(category: ReportCategory) {
  switch (category) {
    case "road":
      return "На фото заметен дорожный дефект, требующий проверки.";
    case "light":
      return "На фото вероятна неисправность уличного освещения.";
    case "trash":
      return "На фото заметно скопление мусора или неубранная зона.";
    case "traffic":
      return "На фото вероятна проблема с дорожной организацией движения.";
    case "other":
      return "На фото заметна городская проблема, требующая ручной оценки.";
  }
}

function fallbackObservedIssue(category: ReportCategory, address: string | null) {
  const location = address ? ` по адресу ${address}` : "";

  switch (category) {
    case "road":
      return `Вероятный дефект дорожного полотна${location}.`;
    case "light":
      return `Вероятная неисправность фонаря или слабое освещение${location}.`;
    case "trash":
      return `Вероятное скопление мусора${location}.`;
    case "traffic":
      return `Вероятная проблема со светофором или дорожным движением${location}.`;
    case "other":
      return `Нужна дополнительная ручная проверка проблемы${location}.`;
  }
}

function fallbackUrgency(visualSeverity: AiVisualSeverity) {
  switch (visualSeverity) {
    case "high":
      return "Нужна быстрая выездная проверка и постановка в срочный план.";
    case "medium":
      return "Стоит включить в ближайший рабочий цикл и проверить на месте.";
    case "low":
      return "Можно обработать в плановом порядке без экстренной эскалации.";
  }
}

function fallbackSafetyRisk(
  category: ReportCategory,
  visualSeverity: AiVisualSeverity,
) {
  if (visualSeverity === "high" && category === "road") {
    return "Повреждение покрытия может создать риск ДТП и травм пешеходов.";
  }

  if (category === "light") {
    return "Плохая освещённость снижает видимость и повышает риск инцидентов.";
  }

  if (category === "trash") {
    return "Загрязнение ухудшает санитарное состояние и визуальное восприятие района.";
  }

  if (category === "traffic") {
    return "Сбой дорожной инфраструктуры может привести к конфликтным ситуациям на дороге.";
  }

  return "Требуется ручная оценка фактического риска на месте.";
}

function fallbackRecommendedAction(
  category: ReportCategory,
  visualSeverity: AiVisualSeverity,
) {
  if (category === "road" && visualSeverity === "high") {
    return "Передать дорожной службе на срочный осмотр и временно обезопасить участок.";
  }

  if (category === "light") {
    return "Проверить линию питания и запланировать замену светильника или лампы.";
  }

  if (category === "trash") {
    return "Передать коммунальной службе на уборку и фотофиксацию после выполнения.";
  }

  if (category === "traffic") {
    return "Передать дорожному оператору для диагностики оборудования и режима работы.";
  }

  return "Назначить выездную проверку и уточнить объём работ.";
}
