import { CATEGORY_META } from "@/lib/constants";
import { getDistanceInMeters } from "@/lib/clustering";
import type {
  AiValidationStatus,
  AiVisualSeverity,
  ClusterRecord,
  PriorityFactor,
  ReportCategory,
  ReportRecord,
} from "@/types";

type BuildPriorityAssessmentInput = {
  report: ReportRecord;
  cluster: ClusterRecord;
  nearbyOpenClusters: ClusterRecord[];
  zoneCoefficient: number;
};

type PriorityAssessment = {
  priorityScore: number;
  priorityReason: string;
  topFactors: PriorityFactor[];
};

const CATEGORY_IMPACT: Record<ReportCategory, number> = {
  road: 14,
  light: 10,
  traffic: 12,
  trash: 8,
  other: 6,
};

const VISUAL_SEVERITY_IMPACT: Record<AiVisualSeverity, number> = {
  high: 24,
  medium: 14,
  low: 6,
};

const VALIDATION_IMPACT: Record<AiValidationStatus, number> = {
  valid: 0,
  uncertain: -8,
  invalid: -18,
  unavailable: -4,
};

export function buildPriorityAssessment({
  report,
  cluster,
  nearbyOpenClusters,
  zoneCoefficient,
}: BuildPriorityAssessmentInput): PriorityAssessment {
  const effectiveCategory =
    report.expertCategory ?? report.aiCategory ?? report.userCategory;
  const effectiveSeverity = report.expertVisualSeverity ?? report.aiVisualSeverity;
  const nearbyDensity = nearbyOpenClusters.filter(
    (item) =>
      item.id !== cluster.id &&
      item.status !== "closed" &&
      getDistanceInMeters(cluster.lat, cluster.lng, item.lat, item.lng) <= 250,
  ).length;
  const factors: PriorityFactor[] = [
    {
      key: "category",
      label: getCategoryFactorLabel(effectiveCategory),
      impact: CATEGORY_IMPACT[effectiveCategory],
      value: CATEGORY_META[effectiveCategory].label,
    },
    {
      key: "visual_severity",
      label: getVisualSeverityFactorLabel(effectiveSeverity),
      impact: effectiveSeverity ? VISUAL_SEVERITY_IMPACT[effectiveSeverity] : 10,
      value: effectiveSeverity ? getVisualSeverityValue(effectiveSeverity) : "Не определена",
    },
    {
      key: "ai_confidence",
      label: "AI достаточно уверен в распознавании",
      impact: report.aiConfidence ? Math.round(report.aiConfidence * 12) : 0,
      value: report.aiConfidence ? `${Math.round(report.aiConfidence * 100)}%` : "Нет оценки",
    },
    {
      key: "cluster_volume",
      label: "По этому месту уже есть несколько жалоб",
      impact: Math.min(cluster.reportCount, 5) * 4,
      value: `${cluster.reportCount}`,
    },
    {
      key: "nearby_density",
      label: "Рядом есть похожие проблемные точки",
      impact: Math.min(nearbyDensity, 4) * 3,
      value: `${nearbyDensity}`,
    },
    {
      key: "recency",
      label: "Жалоба свежая и требует внимания",
      impact: getRecencyImpact(report.createdAt),
      value: formatRecencyValue(report.createdAt),
    },
    {
      key: "zone",
      label: "Проблема находится в важной зоне",
      impact: Math.max(0, Math.min(8, Math.round((zoneCoefficient - 1) * 10))),
      value: zoneCoefficient.toFixed(1),
    },
    {
      key: "validation",
      label: getValidationFactorLabel(report.aiValidationStatus),
      impact: VALIDATION_IMPACT[report.aiValidationStatus],
      value: report.aiValidationStatus,
    },
    {
      key: "description",
      label: "Есть описание от жителя",
      impact: report.description.trim() ? 4 : 0,
      value: report.description.trim() ? "Есть описание" : "Без описания",
    },
  ];

  const score = clamp(
    factors.reduce((total, item) => total + item.impact, 0),
    0,
    100,
  );
  const topFactors = [...factors]
    .sort((left, right) => right.impact - left.impact)
    .slice(0, 3);

  return {
    priorityScore: score,
    priorityReason: buildPriorityReason(effectiveCategory, effectiveSeverity, topFactors),
    topFactors,
  };
}

export function getEffectiveCategory(report: ReportRecord) {
  return report.expertCategory ?? report.aiCategory ?? report.userCategory;
}

export function getEffectiveVisualSeverity(report: ReportRecord) {
  return report.expertVisualSeverity ?? report.aiVisualSeverity;
}

function getCategoryFactorLabel(category: ReportCategory) {
  switch (category) {
    case "road":
      return "Проблема связана с дорогой и движением";
    case "light":
      return "Проблема влияет на освещение и видимость";
    case "traffic":
      return "Проблема влияет на безопасность движения";
    case "trash":
      return "Проблема ухудшает санитарное состояние";
    case "other":
      return "Проблема относится к городской инфраструктуре";
  }
}

function getVisualSeverityFactorLabel(level: AiVisualSeverity | null) {
  switch (level) {
    case "high":
      return "Высокая визуальная срочность";
    case "medium":
      return "Средняя визуальная срочность";
    case "low":
      return "Низкая визуальная срочность";
    case null:
      return "Срочность требует ручной проверки";
  }
}

function getVisualSeverityValue(level: AiVisualSeverity) {
  switch (level) {
    case "high":
      return "Высокая";
    case "medium":
      return "Средняя";
    case "low":
      return "Низкая";
  }
}

function getValidationFactorLabel(status: AiValidationStatus) {
  switch (status) {
    case "valid":
      return "AI подтвердил, что это профильная проблема";
    case "uncertain":
      return "AI не до конца уверен в оценке";
    case "invalid":
      return "AI заметил риск ошибочной классификации";
    case "unavailable":
      return "Оценка AI была ограничена";
  }
}

function getRecencyImpact(createdAt: string) {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  if (ageInHours <= 24) {
    return 8;
  }

  if (ageInHours <= 72) {
    return 6;
  }

  if (ageInHours <= 24 * 7) {
    return 4;
  }

  return 2;
}

function formatRecencyValue(createdAt: string) {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  if (ageInHours <= 24) {
    return "Меньше суток";
  }

  if (ageInHours <= 72) {
    return "До трёх дней";
  }

  if (ageInHours <= 24 * 7) {
    return "До недели";
  }

  return "Старше недели";
}

function buildPriorityReason(
  category: ReportCategory,
  visualSeverity: AiVisualSeverity | null,
  topFactors: PriorityFactor[],
) {
  const categoryLabel = CATEGORY_META[category].label;
  const severityText = visualSeverity
    ? `Визуально проблема выглядит ${getReasonSeverityText(visualSeverity)}.`
    : "Визуальная срочность пока требует ручной оценки.";
  const topLabels = topFactors
    .map((item) => item.label.toLowerCase())
    .slice(0, 3)
    .join(", ");

  return `${categoryLabel}: ${severityText} Главные причины приоритета: ${topLabels}.`;
}

function getReasonSeverityText(level: AiVisualSeverity) {
  switch (level) {
    case "high":
      return "очень срочной";
    case "medium":
      return "заметной и требующей скорой проверки";
    case "low":
      return "умеренной";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
