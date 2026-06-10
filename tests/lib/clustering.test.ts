import { describe, expect, it } from "vitest";

import { CLUSTER_RADIUS_METERS, findMatchingCluster } from "@/lib/clustering";
import type { ClusterRecord } from "@/types";

const baseCluster: ClusterRecord = {
  id: "cluster-road-1",
  category: "road",
  effectiveCategory: "road",
  lat: 43.238949,
  lng: 76.889709,
  address: "Abay Ave 10",
  district: "Medeu",
  zoneCoefficient: 1,
  reportCount: 2,
  severity: 9,
  priorityScore: 48,
  priorityReason: "Дороги: Визуально проблема выглядит заметной.",
  topFactors: [],
  prioritySourceReportId: "report-1",
  status: "open",
  representativePhotoUrl: null,
  aiValidationStatus: "valid",
  effectiveVisualSeverity: "medium",
  moderatorReviewStatus: "pending",
  createdAt: "2026-03-27T00:00:00.000Z",
  updatedAt: "2026-03-27T00:00:00.000Z",
};

describe("findMatchingCluster", () => {
  it("matches a cluster when the category is the same and the point is within 50 meters", () => {
    const match = findMatchingCluster({
      category: "road",
      lat: 43.23902,
      lng: 76.88971,
      clusters: [baseCluster],
    });

    expect(match?.id).toBe(baseCluster.id);
  });

  it("does not match clusters from another category", () => {
    const match = findMatchingCluster({
      category: "trash",
      lat: 43.23902,
      lng: 76.88971,
      clusters: [baseCluster],
    });

    expect(match).toBeNull();
  });

  it("does not match when the point is outside the cluster radius", () => {
    const match = findMatchingCluster({
      category: "road",
      lat: 43.245,
      lng: 76.901,
      clusters: [baseCluster],
    });

    expect(match).toBeNull();
  });

  it("exposes the cluster radius constant used by the app", () => {
    expect(CLUSTER_RADIUS_METERS).toBe(50);
  });
});
