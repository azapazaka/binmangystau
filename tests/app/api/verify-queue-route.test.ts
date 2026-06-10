import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentCitizenMock = vi.fn();
const listCitizenVerificationQueueMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentCitizen: getCurrentCitizenMock,
}));

vi.mock("@/lib/data-store", () => ({
  listCitizenVerificationQueue: listCitizenVerificationQueueMock,
}));

describe("verify queue route", () => {
  beforeEach(() => {
    vi.resetModules();
    getCurrentCitizenMock.mockReset();
    listCitizenVerificationQueueMock.mockReset();
  });

  it("returns 401 when there is no active citizen session", async () => {
    getCurrentCitizenMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/reports/verify-queue/route");
    const response = await GET(new Request("http://localhost/api/reports/verify-queue"));

    expect(response.status).toBe(401);
    expect(listCitizenVerificationQueueMock).not.toHaveBeenCalled();
  });

  it("returns the current citizen verification queue", async () => {
    getCurrentCitizenMock.mockResolvedValue({
      id: "citizen-1",
      role: "citizen",
      email: "citizen@citypulse.local",
      fullName: "Citizen",
      isDemo: false,
    });
    listCitizenVerificationQueueMock.mockResolvedValue([
      { id: "report-1", humanConfirmationStatus: "pending" },
    ]);

    const { GET } = await import("@/app/api/reports/verify-queue/route");
    const response = await GET(new Request("http://localhost/api/reports/verify-queue?limit=4"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listCitizenVerificationQueueMock).toHaveBeenCalledWith("citizen-1", {
      limit: 4,
      includeReviewed: false,
    });
    expect(payload.reports).toHaveLength(1);
  });

  it("allows replay mode only for demo citizens", async () => {
    getCurrentCitizenMock.mockResolvedValue({
      id: "citizen-demo",
      role: "citizen",
      email: "citizen@citypulse.local",
      fullName: "Demo Citizen",
      isDemo: true,
    });
    listCitizenVerificationQueueMock.mockResolvedValue([
      { id: "report-1", humanConfirmationStatus: "pending" },
    ]);

    const { GET } = await import("@/app/api/reports/verify-queue/route");
    const response = await GET(
      new Request("http://localhost/api/reports/verify-queue?limit=6&includeReviewed=1"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listCitizenVerificationQueueMock).toHaveBeenCalledWith("citizen-demo", {
      limit: 6,
      includeReviewed: true,
    });
    expect(payload.reports).toHaveLength(1);
  });
});
