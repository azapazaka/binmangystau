import { describe, expect, it } from "vitest";

import { buildPriorityAssessment } from "@/lib/priority";
import type { ClusterRecord, ReportRecord } from "@/types";

function createCluster(overrides: Partial<ClusterRecord> = {}): ClusterRecord {
  return {
    id: "cluster-1",
    category: "road",
    effectiveCategory: "road",
    lat: 43.238949,
    lng: 76.889709,
    address: "пр. Абая, 10",
    district: "Медеуский район",
    reportCount: 3,
    severity: 13.5,
    priorityScore: 0,
    priorityReason: null,
    topFactors: [],
    prioritySourceReportId: null,
    status: "open",
    representativePhotoUrl: "https://example.com/photo.jpg",
    aiValidationStatus: "valid",
    effectiveVisualSeverity: "high",
    moderatorReviewStatus: "pending",
    createdAt: "2026-03-21T10:00:00.000Z",
    updatedAt: "2026-03-27T09:30:00.000Z",
    ...overrides,
    zoneCoefficient: overrides.zoneCoefficient ?? 1,
  };
}

function createReport(overrides: Partial<ReportRecord> = {}): ReportRecord {
  return {
    id: "report-1",
    clusterId: "cluster-1",
    userCategory: "road",
    description: "Большая яма возле остановки и пешеходного перехода.",
    photoUrl: "https://example.com/photo.jpg",
    lat: 43.238949,
    lng: 76.889709,
    address: "пр. Абая, 10",
    district: "Медеуский район",
    severity: 13.5,
    priorityScore: 0,
    priorityReason: null,
    topFactors: [],
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
    aiDeepAnalysis: null,
    aiDeepAnalyzedAt: null,
    aiRaw: { provider: "seed" },
    humanRealVotes: 0,
    humanFakeVotes: 0,
    humanVotesTotal: 0,
    humanConfirmationStatus: "pending",
    humanLastVotedAt: null,
    submittedBy: "citizen@citypulse.local",
    createdAt: "2026-03-27T09:30:00.000Z",
    updatedAt: "2026-03-27T09:30:00.000Z",
    ...overrides,
  };
}

describe("buildPriorityAssessment", () => {
  it("builds a capped priority score with human-readable explanation and top factors", () => {
    const report = createReport();
    const cluster = createCluster();
    const nearbyClusters = [
      cluster,
      createCluster({
        id: "cluster-2",
        lat: 43.2392,
        lng: 76.8899,
        reportCount: 2,
      }),
      createCluster({
        id: "cluster-3",
        lat: 43.2393,
        lng: 76.8898,
        reportCount: 1,
      }),
    ];

    const assessment = buildPriorityAssessment({
      report,
      cluster,
      nearbyOpenClusters: nearbyClusters,
      zoneCoefficient: 1.6,
    });

    expect(assessment.priorityScore).toBeGreaterThan(0);
    expect(assessment.priorityScore).toBeLessThanOrEqual(100);
    expect(assessment.priorityReason).toContain("Дороги");
    expect(assessment.priorityReason).toContain("высок");
    expect(assessment.topFactors).toHaveLength(3);
    expect(assessment.topFactors.map((item) => item.label)).toContain(
      "Высокая визуальная срочность",
    );
  });

  it("uses expert overrides and penalizes invalid AI assessments", () => {
    const report = createReport({
      userCategory: "other",
      aiCategory: "light",
      aiConfidence: 0.52,
      aiValidationStatus: "invalid",
      aiVisualSeverity: "low",
      expertCategory: "traffic",
      expertVisualSeverity: "high",
    });
    const cluster = createCluster({
      category: "other",
      aiValidationStatus: "invalid",
    });

    const assessment = buildPriorityAssessment({
      report,
      cluster,
      nearbyOpenClusters: [cluster],
      zoneCoefficient: 1,
    });

    expect(assessment.priorityReason).toContain("Трафик");
    expect(assessment.topFactors.map((item) => item.label)).toContain(
      "Высокая визуальная срочность",
    );
    expect(assessment.priorityScore).toBeLessThan(60);
  });
});
