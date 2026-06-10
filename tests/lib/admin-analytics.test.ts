import { describe, expect, it } from "vitest";

import { buildAdminAnalyticsViewModel } from "@/lib/admin-analytics";
import type { ClusterRecord, ReportRecord } from "@/types";

function createCluster(overrides: Partial<ClusterRecord>): ClusterRecord {
  return {
    id: "cluster-1",
    category: "road",
    effectiveCategory: "road",
    lat: 43.24,
    lng: 76.89,
    address: "Абая 10",
    district: "Алмалинский район",
    zoneCoefficient: 1,
    reportCount: 2,
    severity: 4,
    priorityScore: 4,
    priorityReason: null,
    topFactors: [],
    prioritySourceReportId: "report-1",
    status: "open",
    representativePhotoUrl: null,
    aiValidationStatus: "valid",
    effectiveVisualSeverity: "medium",
    moderatorReviewStatus: "pending",
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-01T09:00:00.000Z",
    ...overrides,
  };
}

function createReport(overrides: Partial<ReportRecord>): ReportRecord {
  return {
    id: "report-1",
    clusterId: "cluster-1",
    userCategory: "road",
    description: "Яма возле остановки",
    photoUrl: "/demo.jpg",
    lat: 43.24,
    lng: 76.89,
    address: "Абая 10",
    district: "Алмалинский район",
    severity: 4,
    priorityScore: 4,
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
    aiConfidence: 0.9,
    aiTags: [],
    aiValidationStatus: "valid",
    aiNeedsReview: false,
    aiReason: null,
    aiVisualSeverity: "medium",
    aiDeepAnalysis: null,
    aiDeepAnalyzedAt: null,
    aiRaw: null,
    humanRealVotes: 0,
    humanFakeVotes: 0,
    humanVotesTotal: 0,
    humanConfirmationStatus: "pending",
    humanLastVotedAt: null,
    submittedBy: "citizen@example.com",
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-01T09:00:00.000Z",
    ...overrides,
  };
}

describe("admin analytics view model", () => {
  it("aggregates reports and clusters into dashboard sections", () => {
    const clusters = [
      createCluster({
        id: "cluster-1",
        category: "road",
        district: "Медеуский район",
        severity: 4.5,
        status: "open",
      }),
      createCluster({
        id: "cluster-2",
        category: "trash",
        district: "Медеуский район",
        severity: 2.25,
        status: "closed",
      }),
      createCluster({
        id: "cluster-3",
        category: "light",
        district: "Бостандыкский район",
        severity: 3,
        status: "in_progress",
      }),
    ];
    const reports = [
      createReport({
        id: "report-1",
        clusterId: "cluster-1",
        userCategory: "road",
        createdAt: "2026-03-30T08:00:00.000Z",
      }),
      createReport({
        id: "report-2",
        clusterId: "cluster-1",
        userCategory: "road",
        createdAt: "2026-03-31T09:00:00.000Z",
      }),
      createReport({
        id: "report-3",
        clusterId: "cluster-2",
        userCategory: "trash",
        district: "Медеуский район",
        status: "closed",
        createdAt: "2026-04-01T10:00:00.000Z",
      }),
      createReport({
        id: "report-4",
        clusterId: "cluster-3",
        userCategory: "light",
        district: "Бостандыкский район",
        status: "in_progress",
        createdAt: "2026-04-02T11:00:00.000Z",
      }),
    ];

    const model = buildAdminAnalyticsViewModel({ clusters, reports, now: "2026-04-02T12:00:00.000Z" });

    expect(model.kpis.totalReports.value).toBe(4);
    expect(model.kpis.activeClusters.value).toBe(2);
    expect(model.kpis.resolvedClusters.value).toBe(1);
    expect(model.timeline.length).toBeGreaterThanOrEqual(4);
    expect(model.categories.find((item) => item.key === "road")?.value).toBe(2);
    expect(model.statuses.find((item) => item.key === "closed")?.value).toBe(1);
    expect(model.districts[0]).toMatchObject({
      district: "Медеуский район",
      value: 2,
    });
    expect(model.severity[0]).toMatchObject({
      clusterId: "cluster-1",
      severity: 4.5,
    });
    expect(model.highlights.topCategory).toBe("Дороги");
    expect(model.highlights.topDistrict).toBe("Медеуский район");
  });

  it("returns friendly empty states when there is no analytics data", () => {
    const model = buildAdminAnalyticsViewModel({
      clusters: [],
      reports: [],
      now: "2026-04-02T12:00:00.000Z",
    });

    expect(model.timeline).toHaveLength(0);
    expect(model.districts).toHaveLength(0);
    expect(model.highlights.topDistrict).toBe("Нет данных");
    expect(model.kpis.averageSeverity.value).toBe("0.0");
  });
});
