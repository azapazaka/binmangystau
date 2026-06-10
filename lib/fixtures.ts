import type {
  ClusterRecord,
  PriorityFactor,
  ReportRecord,
  StatusHistoryRecord,
} from "@/types";

function makeTopFactors(...items: Array<{ key: PriorityFactor["key"]; label: string; impact: number; value: string }>): PriorityFactor[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    impact: item.impact,
    value: item.value,
  }));
}

export const seedClusters: ClusterRecord[] = [
  {
    id: "0d6d5947-57ff-45d4-b7fb-8d6b331c5ab1",
    category: "road",
    effectiveCategory: "road",
    lat: 43.238949,
    lng: 76.889709,
    address: "пр. Абая, 10",
    district: "Медеуский район",
    zoneCoefficient: 1.6,
    reportCount: 3,
    severity: 13.5,
    priorityScore: 85,
    priorityReason:
      "Дороги: Визуально проблема выглядит очень срочной. Главные причины приоритета: высокая визуальная срочность, по этому месту уже есть несколько жалоб, проблема находится в важной зоне.",
    topFactors: makeTopFactors(
      {
        key: "visual_severity",
        label: "Высокая визуальная срочность",
        impact: 24,
        value: "Высокая",
      },
      {
        key: "cluster_volume",
        label: "По этому месту уже есть несколько жалоб",
        impact: 12,
        value: "3",
      },
      {
        key: "zone",
        label: "Проблема находится в важной зоне",
        impact: 6,
        value: "1.6",
      },
    ),
    prioritySourceReportId: "4f167307-7a1d-4bb0-bf57-f3fb4f1128ce",
    status: "open",
    representativePhotoUrl:
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
    aiValidationStatus: "valid",
    effectiveVisualSeverity: "high",
    moderatorReviewStatus: "pending",
    createdAt: "2026-03-21T10:00:00.000Z",
    updatedAt: "2026-03-27T09:30:00.000Z",
  },
  {
    id: "fdce5b2e-a5cf-4f74-b43d-56410d930712",
    category: "light",
    effectiveCategory: "light",
    lat: 43.222015,
    lng: 76.851248,
    address: "ул. Толе би, 123",
    district: "Алмалинский район",
    zoneCoefficient: 1.2,
    reportCount: 2,
    severity: 6,
    priorityScore: 59,
    priorityReason:
      "Освещение: Визуально проблема выглядит заметной и требующей скорой проверки. Главные причины приоритета: средняя визуальная срочность, по этому месту уже есть несколько жалоб, жалоба свежая и требует внимания.",
    topFactors: makeTopFactors(
      {
        key: "visual_severity",
        label: "Средняя визуальная срочность",
        impact: 14,
        value: "Средняя",
      },
      {
        key: "cluster_volume",
        label: "По этому месту уже есть несколько жалоб",
        impact: 8,
        value: "2",
      },
      {
        key: "recency",
        label: "Жалоба свежая и требует внимания",
        impact: 6,
        value: "До трёх дней",
      },
    ),
    prioritySourceReportId: "aee51bcb-3857-4f70-a52b-98c106fe3aa7",
    status: "in_progress",
    representativePhotoUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
    aiValidationStatus: "valid",
    effectiveVisualSeverity: "medium",
    moderatorReviewStatus: "pending",
    createdAt: "2026-03-20T08:15:00.000Z",
    updatedAt: "2026-03-26T16:15:00.000Z",
  },
];

export const seedReports: ReportRecord[] = [
  {
    id: "4f167307-7a1d-4bb0-bf57-f3fb4f1128ce",
    clusterId: seedClusters[0].id,
    userCategory: "road",
    description: "Большая яма у остановки.",
    photoUrl: seedClusters[0].representativePhotoUrl ?? "",
    lat: seedClusters[0].lat,
    lng: seedClusters[0].lng,
    address: seedClusters[0].address,
    district: seedClusters[0].district,
    severity: seedClusters[0].severity,
    priorityScore: seedClusters[0].priorityScore,
    priorityReason: seedClusters[0].priorityReason,
    topFactors: seedClusters[0].topFactors,
    reviewStatus: "pending",
    aiCorrect: null,
    expertCategory: null,
    expertVisualSeverity: null,
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
    status: "open",
    aiCategory: "road",
    aiConfidence: 0.94,
    aiTags: ["pothole", "road_damage"],
    aiValidationStatus: "valid",
    aiNeedsReview: false,
    aiReason: "Detected damaged road surface",
    aiVisualSeverity: "high",
    aiDeepAnalysis: {
      summary:
        "На фото заметна крупная яма возле остановки, проблема выглядит опасной для транспорта.",
      observedIssue:
        "Повреждение дорожного полотна у остановки с заметным провалом покрытия.",
      visualSeverity: "high",
      urgency:
        "Точку стоит передать в срочный дорожный план из-за высокого риска повторных жалоб.",
      safetyRisk:
        "Есть риск повреждения транспорта и травм для пешеходов при обходе дефекта.",
      recommendedAction:
        "Назначить выездную проверку и временно обезопасить участок до ремонта.",
      evidence: ["pothole", "road_damage", "stop_area"],
    },
    aiDeepAnalyzedAt: "2026-03-27T09:40:00.000Z",
    aiRaw: { provider: "seed" },
    humanRealVotes: 2,
    humanFakeVotes: 0,
    humanVotesTotal: 2,
    humanConfirmationStatus: "pending",
    humanLastVotedAt: null,
    submittedBy: "citizen-1@citypulse.local",
    createdAt: "2026-03-21T10:00:00.000Z",
    updatedAt: "2026-03-27T09:30:00.000Z",
  },
  {
    id: "aee51bcb-3857-4f70-a52b-98c106fe3aa7",
    clusterId: seedClusters[1].id,
    userCategory: "light",
    description: "Фонарь не работает уже несколько дней.",
    photoUrl: seedClusters[1].representativePhotoUrl ?? "",
    lat: seedClusters[1].lat,
    lng: seedClusters[1].lng,
    address: seedClusters[1].address,
    district: seedClusters[1].district,
    severity: seedClusters[1].severity,
    priorityScore: seedClusters[1].priorityScore,
    priorityReason: seedClusters[1].priorityReason,
    topFactors: seedClusters[1].topFactors,
    reviewStatus: "pending",
    aiCorrect: null,
    expertCategory: null,
    expertVisualSeverity: null,
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
    status: "in_progress",
    aiCategory: "light",
    aiConfidence: 0.88,
    aiTags: ["street_light", "night_visibility"],
    aiValidationStatus: "valid",
    aiNeedsReview: false,
    aiReason: "Detected broken street lighting",
    aiVisualSeverity: "medium",
    aiDeepAnalysis: {
      summary:
        "Освещение на улице не работает, визуально проблема похожа на локальную неисправность фонаря.",
      observedIssue:
        "Фонарь или линия освещения не обеспечивают нормальную видимость участка.",
      visualSeverity: "medium",
      urgency:
        "Можно обработать в ближайшем цикле, но желательно не откладывать из-за вечерней видимости.",
      safetyRisk:
        "Снижается безопасность пешеходов и обзор в тёмное время суток.",
      recommendedAction:
        "Передать службе освещения на диагностику питания и возможную замену светильника.",
      evidence: ["street_light", "night_visibility"],
    },
    aiDeepAnalyzedAt: "2026-03-26T16:30:00.000Z",
    aiRaw: { provider: "seed" },
    humanRealVotes: 1,
    humanFakeVotes: 0,
    humanVotesTotal: 1,
    humanConfirmationStatus: "pending",
    humanLastVotedAt: null,
    submittedBy: "citizen-2@citypulse.local",
    createdAt: "2026-03-20T08:15:00.000Z",
    updatedAt: "2026-03-26T16:15:00.000Z",
  },
];

export const seedStatusHistory: StatusHistoryRecord[] = [
  {
    id: "history-1",
    clusterId: seedClusters[1].id,
    oldStatus: "open",
    newStatus: "in_progress",
    changedBy: null,
    changedAt: "2026-03-26T16:15:00.000Z",
  },
];

export function makeClusterId(category: string, timestamp = Date.now()) {
  return `cluster-${category}-${timestamp}`;
}

export function makeRecordId(prefix: "report" | "history", timestamp = Date.now()) {
  return `${prefix}-${timestamp}-${Math.round(Math.random() * 10_000)}`;
}
