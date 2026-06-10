import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentCitizenMock = vi.fn();
const upsertHumanVoteForReportMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentCitizen: getCurrentCitizenMock,
}));

vi.mock("@/lib/data-store", () => ({
  upsertHumanVoteForReport: upsertHumanVoteForReportMock,
}));

describe("human vote route", () => {
  beforeEach(() => {
    vi.resetModules();
    getCurrentCitizenMock.mockReset();
    upsertHumanVoteForReportMock.mockReset();
  });

  it("returns 401 when there is no active citizen session", async () => {
    getCurrentCitizenMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/reports/[id]/human-vote/route");
    const response = await POST(
      new Request("http://localhost/api/reports/report-1/human-vote", {
        method: "POST",
        body: JSON.stringify({ verdict: "real" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "report-1" }) },
    );

    expect(response.status).toBe(401);
    expect(upsertHumanVoteForReportMock).not.toHaveBeenCalled();
  });

  it("persists a human vote for the current citizen", async () => {
    getCurrentCitizenMock.mockResolvedValue({
      id: "citizen-1",
      role: "citizen",
      email: "citizen@citypulse.local",
      fullName: "Citizen",
      isDemo: false,
    });
    upsertHumanVoteForReportMock.mockResolvedValue({
      id: "report-1",
      humanConfirmationStatus: "pending",
      humanVotesTotal: 1,
    });

    const { POST } = await import("@/app/api/reports/[id]/human-vote/route");
    const response = await POST(
      new Request("http://localhost/api/reports/report-1/human-vote", {
        method: "POST",
        body: JSON.stringify({ verdict: "fake" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "report-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(upsertHumanVoteForReportMock).toHaveBeenCalledWith("report-1", "citizen-1", "fake");
    expect(payload.report.humanVotesTotal).toBe(1);
  });
});
