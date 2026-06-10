import {
  findBestCategoryFromDescription,
  isClearlyInvalidContext,
} from "@/lib/local-moderation";
import type {
  AiProviderResult,
  AiVisualSeverity,
  ReportCategory,
  ReportDeepAnalysis,
} from "@/types";

type MockClassifierInput = {
  userCategory: ReportCategory;
  imageUrl: string;
  description: string;
};

type MockDeepAnalysisInput = {
  userCategory: ReportCategory;
  description: string;
  address: string | null;
  aiReason: string | null;
  aiVisualSeverity: AiVisualSeverity | null;
  aiTags: string[];
};

export async function classifyWithMockProvider({
  userCategory,
  description,
}: MockClassifierInput): Promise<AiProviderResult> {
  const normalized = description.trim().toLowerCase();
  const bestCategory = findBestCategoryFromDescription(normalized);

  if (isClearlyInvalidContext(normalized)) {
    return {
      isValidReport: false,
      confidence: 0.92,
      tags: ["invalid_context", "manual_review"],
      reason: "Description appears unrelated to a city infrastructure issue",
      visualSeverity: "low",
    };
  }

  return {
    isValidReport: true,
    suggestedCategory: bestCategory ?? userCategory,
    confidence: buildConfidence(userCategory, bestCategory, normalized),
    tags: buildTags(bestCategory ?? userCategory, normalized),
    reason: buildReason(bestCategory ?? userCategory),
    visualSeverity: buildVisualSeverity(bestCategory ?? userCategory, normalized),
  };
}

export async function analyzeWithMockProvider(
  input: MockDeepAnalysisInput,
): Promise<ReportDeepAnalysis> {
  const inferredCategory = findBestCategoryFromDescription(input.description) ?? input.userCategory;
  const visualSeverity =
    input.aiVisualSeverity ?? buildVisualSeverity(inferredCategory, input.description);

  return {
    summary:
      input.aiReason ??
      `${buildReason(inferredCategory)}. Жалоба сохранена в локальном режиме проверки без внешнего AI.`,
    observedIssue:
      input.description ||
      `Точка требует дополнительной ручной проверки оператором${input.address ? ` по адресу ${input.address}` : ""}.`,
    visualSeverity,
    urgency: buildUrgency(visualSeverity),
    safetyRisk: buildSafetyRisk(inferredCategory, visualSeverity),
    recommendedAction: buildRecommendedAction(inferredCategory, visualSeverity),
    evidence: input.aiTags.length > 0 ? input.aiTags : buildTags(inferredCategory, input.description),
  };
}

function buildConfidence(
  userCategory: ReportCategory,
  bestCategory: ReportCategory | null,
  description: string,
) {
  if (!description) {
    return 0.58;
  }

  if (bestCategory && bestCategory !== userCategory) {
    return 0.72;
  }

  if (description.length > 60) {
    return 0.91;
  }

  return 0.83;
}

function buildTags(category: ReportCategory, description: string) {
  const tags = new Set<string>();

  if (description.includes("яма") || description.includes("pothole")) {
    tags.add("pothole");
  }

  if (description.includes("фонарь") || description.includes("освещ")) {
    tags.add("street_light");
  }

  if (description.includes("мусор") || description.includes("свал")) {
    tags.add("trash");
  }

  if (description.includes("светофор") || description.includes("знак")) {
    tags.add("traffic");
  }

  switch (category) {
    case "road":
      tags.add("road_damage");
      break;
    case "light":
      tags.add("night_visibility");
      break;
    case "trash":
      tags.add("cleanup");
      break;
    case "traffic":
      tags.add("intersection");
      break;
    case "other":
      tags.add("urban_issue");
      break;
  }

  return [...tags];
}

function buildReason(category: ReportCategory) {
  switch (category) {
    case "road":
      return "Локальная проверка относит заявку к дорожным дефектам.";
    case "light":
      return "Локальная проверка относит заявку к проблемам освещения.";
    case "trash":
      return "Локальная проверка относит заявку к проблемам мусора и уборки.";
    case "traffic":
      return "Локальная проверка относит заявку к трафику и дорожной инфраструктуре.";
    case "other":
      return "Локальная проверка видит городскую проблему, требующую ручной оценки.";
  }
}

function buildVisualSeverity(category: ReportCategory, description: string): AiVisualSeverity {
  const normalized = description.toLowerCase();

  if (
    category === "road" ||
    category === "traffic" ||
    normalized.includes("опас") ||
    normalized.includes("больш")
  ) {
    return "high";
  }

  if (category === "light") {
    return "medium";
  }

  return "low";
}

function buildUrgency(visualSeverity: AiVisualSeverity) {
  switch (visualSeverity) {
    case "high":
      return "Точку желательно отдать в срочную обработку и проверить на месте как можно быстрее.";
    case "medium":
      return "Точку стоит включить в ближайший рабочий цикл и подтвердить объём проблемы.";
    case "low":
      return "Точку можно оставить в плановом цикле обслуживания без экстренной эскалации.";
  }
}

function buildSafetyRisk(category: ReportCategory, visualSeverity: AiVisualSeverity) {
  if (category === "road" && visualSeverity === "high") {
    return "Есть риск повреждения транспорта и травм пешеходов.";
  }

  if (category === "light") {
    return "Плохая видимость повышает риск инцидентов в тёмное время суток.";
  }

  if (category === "traffic") {
    return "Нарушение работы дорожной инфраструктуры может создать аварийные ситуации.";
  }

  if (category === "trash") {
    return "Скопление мусора ухудшает санитарное состояние и визуальное качество городской среды.";
  }

  return "Требуется очная проверка оператора для уточнения риска.";
}

function buildRecommendedAction(
  category: ReportCategory,
  visualSeverity: AiVisualSeverity,
) {
  if (category === "road" && visualSeverity === "high") {
    return "Передать дорожной службе на срочную выездную проверку и временно обезопасить участок.";
  }

  switch (category) {
    case "road":
      return "Передать дорожной инспекции для уточнения объёма ремонта.";
    case "light":
      return "Передать в службу освещения на диагностику и ремонт.";
    case "trash":
      return "Передать коммунальной службе на уборку и подтверждение выполнения.";
    case "traffic":
      return "Передать дорожному оператору на проверку оборудования и разметки.";
    case "other":
      return "Назначить ручную модерацию и определить профиль исполнителя.";
  }
}
