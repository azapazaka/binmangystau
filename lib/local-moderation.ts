import type { ReportCategory } from "@/types";

export type ModerationDecision = "accepted" | "retry" | "rejected";

export type ModerationResult = {
  decision: ModerationDecision;
  message: string;
  reasons: string[];
  suggestedCategory: ReportCategory | null;
  moderationAttemptCount: number;
};

type AssessSubmissionInput = {
  category: ReportCategory;
  description: string;
  moderationAttemptCount: number;
};

const CATEGORY_KEYWORDS: Record<ReportCategory, string[]> = {
  road: [
    "яма",
    "ямы",
    "выбоина",
    "асфальт",
    "дорога",
    "трещина",
    "люк",
    "бордюр",
    "покрытие",
    "дороги",
    "плохая дорога",
    "плохие дороги",
    "разбитая дорога",
    "разбитые дороги",
    "плохое покрытие",
    "нормальной езды",
    "pothole",
    "asphalt",
    "road",
  ],
  light: [
    "фонарь",
    "освещение",
    "лампа",
    "темно",
    "столб",
    "не горит",
    "перегорел",
    "streetlight",
    "lamp",
    "light",
  ],
  trash: [
    "мусор",
    "свалка",
    "отходы",
    "грязь",
    "контейнер",
    "уборка",
    "бак",
    "баки",
    "переполнен",
    "переполнены",
    "trash",
    "garbage",
    "litter",
  ],
  traffic: [
    "светофор",
    "знак",
    "разметка",
    "перекресток",
    "трафик",
    "переход",
    "traffic",
    "signal",
    "crosswalk",
  ],
  other: [
    "улица",
    "двор",
    "тротуар",
    "город",
    "парк",
    "сквер",
    "остановка",
    "алматы",
    "street",
    "city",
  ],
};

const GENERIC_URBAN_KEYWORDS = [
  "улица",
  "проспект",
  "проезд",
  "двор",
  "тротуар",
  "район",
  "перекресток",
  "остановка",
  "алматы",
  "город",
  "street",
  "road",
  "city",
  "district",
];

const INVALID_CONTEXT_KEYWORDS = [
  "квартира",
  "комната",
  "кухня",
  "спальня",
  "ванна",
  "диван",
  "телевизор",
  "кот",
  "кошка",
  "собака",
  "селфи",
  "еда",
  "доставка",
  "ресторан",
  "ноутбук",
  "компьютер",
  "indoor",
  "kitchen",
  "bedroom",
  "selfie",
  "food",
  "cat",
  "dog",
];

export function assessReportModeration({
  category,
  description,
  moderationAttemptCount,
}: AssessSubmissionInput): ModerationResult {
  const attemptCount = Math.max(1, moderationAttemptCount);
  const normalized = normalizeText(description);
  const reasons: string[] = [];
  const categoryScores = scoreCategories(normalized);
  const bestCategory = getBestCategory(categoryScores);
  const selectedScore = categoryScores[category];
  const bestScore = bestCategory ? categoryScores[bestCategory] : 0;
  const invalidContext = countMatches(normalized, INVALID_CONTEXT_KEYWORDS) > 0;
  const urbanContext = countMatches(normalized, GENERIC_URBAN_KEYWORDS) > 0;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  if (normalized.length < 12 || wordCount < 3) {
    reasons.push(
      "Опишите проблему подробнее: что именно сломано или требует внимания, и где это находится.",
    );
  }

  if (invalidContext) {
    reasons.push(
      "Описание похоже на личный или бытовой контекст, а не на городскую инфраструктурную проблему.",
    );
  }

  if (!urbanContext && bestScore === 0) {
    reasons.push(
      "Описание не показывает связь с городской средой, дорогой, освещением, мусором или трафиком.",
    );
  }

  if (bestCategory && bestCategory !== category && bestScore >= 1 && selectedScore === 0) {
    reasons.push(
      `Описание больше похоже на категорию "${translateCategory(bestCategory)}", а не на выбранную категорию.`,
    );
  }

  if (reasons.length === 0) {
    return {
      decision: "accepted",
      message: "Заявка прошла локальную проверку и готова к отправке.",
      reasons: [],
      suggestedCategory: bestCategory,
      moderationAttemptCount: attemptCount,
    };
  }

  return {
    decision: attemptCount >= 3 ? "rejected" : "retry",
    message:
      attemptCount >= 3
        ? "Заявка отклонена после трёх неудачных попыток. Начните новую заявку и опишите городскую проблему точнее."
        : attemptCount === 2
          ? "Повторная проверка снова не пройдена. Исправьте описание или категорию, иначе следующая попытка будет отклонена."
          : "Заявка пока не отправлена. Уточните описание проблемы и попробуйте ещё раз.",
    reasons,
    suggestedCategory: bestCategory && bestCategory !== category ? bestCategory : null,
    moderationAttemptCount: attemptCount,
  };
}

export function findBestCategoryFromDescription(description: string): ReportCategory | null {
  return getBestCategory(scoreCategories(normalizeText(description)));
}

export function isClearlyInvalidContext(description: string) {
  return countMatches(normalizeText(description), INVALID_CONTEXT_KEYWORDS) > 0;
}

function scoreCategories(description: string) {
  return (Object.keys(CATEGORY_KEYWORDS) as ReportCategory[]).reduce(
    (accumulator, category) => {
      accumulator[category] = countMatches(description, CATEGORY_KEYWORDS[category]);
      return accumulator;
    },
    {} as Record<ReportCategory, number>,
  );
}

function countMatches(description: string, keywords: string[]) {
  return keywords.filter((keyword) => description.includes(keyword)).length;
}

function getBestCategory(scores: Record<ReportCategory, number>) {
  const sorted = (Object.entries(scores) as [ReportCategory, number][]).sort(
    (left, right) => right[1] - left[1],
  );

  if (!sorted[0] || sorted[0][1] === 0) {
    return null;
  }

  return sorted[0][0];
}

function normalizeText(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function translateCategory(category: ReportCategory) {
  switch (category) {
    case "road":
      return "Дороги";
    case "light":
      return "Освещение";
    case "trash":
      return "Мусор";
    case "traffic":
      return "Трафик";
    case "other":
      return "Другое";
  }
}
