import { describe, expect, it } from "vitest";

import {
  getSeverityLevel,
  getSeverityLevelSummary,
} from "@/lib/severity-levels";
import type { ClusterRecord } from "@/types";

const clusters: ClusterRecord[] = [
  {
    id: "low-1",
    category: "other",
    effectiveCategory: "other",
    lat: 43.2,
    lng: 76.8,
    address: "Low zone",
    district: "Medeu",
    zoneCoefficient: 1,
    reportCount: 1,
    severity: 4.9,
    priorityScore: 18,
    priorityReason: "Другое: Приоритет низкий.",
    topFactors: [],
    prioritySourceReportId: "report-low-1",
    status: "open",
    representativePhotoUrl: null,
    aiValidationStatus: "valid",
    effectiveVisualSeverity: "low",
    moderatorReviewStatus: "pending",
    createdAt: "2026-03-27T10:00:00.000Z",
    updatedAt: "2026-03-27T10:00:00.000Z",
  },
  {
    id: "medium-1",
    category: "trash",
    effectiveCategory: "trash",
    lat: 43.21,
    lng: 76.81,
    address: "Medium zone",
    district: "Almaly",
    zoneCoefficient: 1,
    reportCount: 2,
    severity: 7.2,
    priorityScore: 44,
    priorityReason: "Мусор: Приоритет средний.",
    topFactors: [],
    prioritySourceReportId: "report-medium-1",
    status: "in_progress",
    representativePhotoUrl: null,
    aiValidationStatus: "uncertain",
    effectiveVisualSeverity: "medium",
    moderatorReviewStatus: "pending",
    createdAt: "2026-03-27T10:00:00.000Z",
    updatedAt: "2026-03-27T10:00:00.000Z",
  },
  {
    id: "critical-1",
    category: "road",
    effectiveCategory: "road",
    lat: 43.22,
    lng: 76.82,
    address: "Critical zone",
    district: "Bostandyk",
    zoneCoefficient: 1.4,
    reportCount: 4,
    severity: 11.4,
    priorityScore: 82,
    priorityReason: "Дороги: Приоритет высокий.",
    topFactors: [],
    prioritySourceReportId: "report-critical-1",
    status: "open",
    representativePhotoUrl: null,
    aiValidationStatus: "valid",
    effectiveVisualSeverity: "high",
    moderatorReviewStatus: "pending",
    createdAt: "2026-03-27T10:00:00.000Z",
    updatedAt: "2026-03-27T10:00:00.000Z",
  },
];

describe("severity levels", () => {
  it("maps severity score to low, medium, and critical levels", () => {
    expect(getSeverityLevel(3.2)).toBe("low");
    expect(getSeverityLevel(4.5)).toBe("low");
    expect(getSeverityLevel(5)).toBe("medium");
    expect(getSeverityLevel(6)).toBe("medium");
    expect(getSeverityLevel(8.99)).toBe("medium");
    expect(getSeverityLevel(9)).toBe("critical");
  });

  it("builds a summary for the admin map legend", () => {
    expect(getSeverityLevelSummary(clusters)).toEqual({
      low: 1,
      medium: 1,
      critical: 1,
    });
  });
});
