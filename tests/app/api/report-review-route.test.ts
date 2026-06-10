import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentAdminMock = vi.fn();
const reviewReportMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentAdmin: getCurrentAdminMock,
}));

vi.mock("@/lib/data-store", () => ({
  reviewReportByAdmin: reviewReportMock,
}));

describe("PATCH /api/reports/[id]/review", () => {
  beforeEach(() => {
    getCurrentAdminMock.mockReset();
    reviewReportMock.mockReset();
  });

  it("returns 401 when there is no current admin", async () => {
    getCurrentAdminMock.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/reports/[id]/review/route");
    const response = await PATCH(
      new Request("http://localhost/api/reports/report-1/review", {
        method: "PATCH",
        body: JSON.stringify({ verdict: "confirmed" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "report-1" }) },
    );

    expect(response.status).toBe(401);
    expect(reviewReportMock).not.toHaveBeenCalled();
  });

  it("passes moderator corrections through to the review service", async () => {
    getCurrentAdminMock.mockResolvedValue({
      id: "admin-1",
      fullName: "Demo Admin",
    });
    reviewReportMock.mockResolvedValue({
      report: { id: "report-1", reviewStatus: "corrected", priorityScore: 72 },
      cluster: { id: "cluster-1", priorityScore: 72 },
      stats: {
        totalReports: 10,
        weeklyReports: 3,
        inProgress: 2,
        resolved: 4,
        reviewedReports: 5,
        aiCorrectReports: 3,
        correctedReports: 2,
        aiAgreementRate: 60,
      },
    });

    const { PATCH } = await import("@/app/api/reports/[id]/review/route");
    const response = await PATCH(
      new Request("http://localhost/api/reports/report-1/review", {
        method: "PATCH",
        body: JSON.stringify({
          verdict: "corrected",
          correctedCategory: "traffic",
          correctedVisualSeverity: "high",
          note: "Нужно поднять приоритет из-за риска ДТП.",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "report-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(reviewReportMock).toHaveBeenCalledWith("report-1", {
      verdict: "corrected",
      correctedCategory: "traffic",
      correctedVisualSeverity: "high",
      note: "Нужно поднять приоритет из-за риска ДТП.",
      reviewedBy: "admin-1",
    });
    expect(payload.report.reviewStatus).toBe("corrected");
    expect(payload.cluster.priorityScore).toBe(72);
    expect(payload.stats.reviewedReports).toBe(5);
  });
});
