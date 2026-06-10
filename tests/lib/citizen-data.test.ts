import { describe, expect, it } from "vitest";

import {
  buildCitizenLeaderboard,
  getCitizenReports,
  getCitizenSummary,
} from "@/lib/citizen-data";
import type { ReportRecord } from "@/types";

function makeReport(overrides: Partial<ReportRecord>): ReportRecord {
  return {
    id: "report",
    clusterId: "cluster",
    userCategory: "road",
    description: "Road damage",
    photoUrl: "https://example.com/1.jpg",
    lat: 43.23,
    lng: 76.88,
    address: "Abay 1",
    district: "Medeu",
    severity: 9,
    priorityScore: 54,
    priorityReason: "Дороги: Визуально проблема выглядит очень срочной.",
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
    aiConfidence: 0.91,
    aiTags: ["road"],
    aiValidationStatus: "valid",
    aiNeedsReview: false,
    aiReason: "Detected road damage",
    aiVisualSeverity: "high",
    aiDeepAnalysis: null,
    aiDeepAnalyzedAt: null,
    aiRaw: null,
    humanRealVotes: 0,
    humanFakeVotes: 0,
    humanVotesTotal: 0,
    humanConfirmationStatus: "pending",
    humanLastVotedAt: null,
    submittedBy: "citizen-1@citypulse.local",
    createdAt: "2026-03-20T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
    ...overrides,
  };
}

const reports: ReportRecord[] = [
  makeReport({
    id: "r1",
    clusterId: "c1",
    userCategory: "road",
    description: "Road damage",
    photoUrl: "https://example.com/1.jpg",
    lat: 43.23,
    lng: 76.88,
    address: "Abay 1",
    district: "Medeu",
    severity: 9,
    status: "open",
    aiCategory: "road",
    aiConfidence: 0.91,
    aiTags: ["road"],
    aiValidationStatus: "valid",
    aiNeedsReview: false,
    aiReason: "Detected road damage",
    aiVisualSeverity: "high",
    aiDeepAnalysis: null,
    aiDeepAnalyzedAt: null,
    aiRaw: null,
    submittedBy: "citizen-1@citypulse.local",
    createdAt: "2026-03-20T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
  }),
  makeReport({
    id: "r2",
    clusterId: "c2",
    userCategory: "light",
    description: "Broken light",
    photoUrl: "https://example.com/2.jpg",
    lat: 43.22,
    lng: 76.86,
    address: "Tole bi 2",
    district: "Almaly",
    severity: 6,
    status: "closed",
    aiCategory: "light",
    aiConfidence: 0.88,
    aiTags: ["light"],
    aiValidationStatus: "valid",
    aiNeedsReview: false,
    aiReason: "Detected broken light",
    aiVisualSeverity: "medium",
    aiDeepAnalysis: null,
    aiDeepAnalyzedAt: null,
    aiRaw: null,
    submittedBy: "citizen-1@citypulse.local",
    createdAt: "2026-03-21T10:00:00.000Z",
    updatedAt: "2026-03-22T10:00:00.000Z",
    priorityScore: 41,
    priorityReason: "Освещение: Визуально проблема выглядит заметной и требующей скорой проверки.",
  }),
  makeReport({
    id: "r3",
    clusterId: "c3",
    userCategory: "trash",
    description: "Trash pile",
    photoUrl: "https://example.com/3.jpg",
    lat: 43.24,
    lng: 76.89,
    address: "Satpayev 3",
    district: "Bostandyk",
    severity: 5,
    status: "in_progress",
    aiCategory: "trash",
    aiConfidence: 0.77,
    aiTags: ["trash"],
    aiValidationStatus: "uncertain",
    aiNeedsReview: true,
    aiReason: "Needs review",
    aiVisualSeverity: "low",
    aiDeepAnalysis: null,
    aiDeepAnalyzedAt: null,
    aiRaw: null,
    submittedBy: "citizen-2@citypulse.local",
    createdAt: "2026-03-22T10:00:00.000Z",
    updatedAt: "2026-03-22T11:00:00.000Z",
    priorityScore: 28,
    priorityReason: "Мусор: Визуально проблема выглядит умеренной.",
  }),
];

describe("citizen data", () => {
  it("returns only reports created by the active citizen", () => {
    expect(getCitizenReports(reports, "citizen-1@citypulse.local")).toHaveLength(2);
    expect(getCitizenReports(reports, "citizen-1@citypulse.local").map((item) => item.id)).toEqual([
      "r2",
      "r1",
    ]);
  });

  it("builds personal summary with total, resolved, and activity score", () => {
    expect(getCitizenSummary(reports, "citizen-1@citypulse.local")).toMatchObject({
      totalReports: 2,
      resolvedReports: 1,
      activityScore: 24,
      currentRank: 1,
    });
  });

  it("builds a leaderboard ordered by activity score", () => {
    expect(buildCitizenLeaderboard(reports)).toEqual([
      {
        citizenId: "citizen-1@citypulse.local",
        totalReports: 2,
        resolvedReports: 1,
        activityScore: 24,
        rank: 1,
      },
      {
        citizenId: "citizen-2@citypulse.local",
        totalReports: 1,
        resolvedReports: 0,
        activityScore: 5,
        rank: 2,
      },
    ]);
  });
});
