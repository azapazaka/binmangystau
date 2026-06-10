import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentCitizenMock = vi.fn();
const createReportMock = vi.fn();
const assessReportModerationMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentCitizen: getCurrentCitizenMock,
}));

vi.mock("@/lib/data-store", () => ({
  createReport: createReportMock,
}));

vi.mock("@/lib/local-moderation", () => ({
  assessReportModeration: assessReportModerationMock,
}));

function createPhotoFile(name = "report.jpg") {
  return new File(["demo-image"], name, { type: "image/jpeg" });
}

describe("POST /api/reports", () => {
  beforeEach(() => {
    getCurrentCitizenMock.mockReset();
    createReportMock.mockReset();
    assessReportModerationMock.mockReset();

    getCurrentCitizenMock.mockResolvedValue({ email: "citizen@citypulse.local" });
    assessReportModerationMock.mockReturnValue({
      decision: "accepted",
      moderationAttemptCount: 1,
    });
    createReportMock.mockResolvedValue({
      id: "report-1",
      address: "проспект Тауелсиздик, 12, Астана",
    });
  });

  it("accepts manual submissions when optional coordinate fields are absent from FormData", async () => {
    const { POST } = await import("@/app/api/reports/route");
    const formData = new FormData();

    formData.set("category", "road");
    formData.set("photo", createPhotoFile());
    formData.set("description", "Большая яма у остановки");
    formData.set("manualAddress", "проспект Тауелсиздик, 12, Астана");
    formData.set("locationSource", "manual");
    formData.set("moderationAttempt", "1");

    const response = await POST({
      formData: async () => formData,
    } as Request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        locationSource: "manual",
        manualAddress: "проспект Тауелсиздик, 12, Астана",
      }),
    );
    expect(payload).toEqual({
      report: {
        id: "report-1",
        address: "проспект Тауелсиздик, 12, Астана",
      },
    });
  });

  it("accepts coordinate submissions when optional manual-address fields are absent from FormData", async () => {
    const { POST } = await import("@/app/api/reports/route");
    const formData = new FormData();

    formData.set("category", "traffic");
    formData.set("photo", createPhotoFile("geolocation.jpg"));
    formData.set("description", "Сломанный светофор на перекрестке");
    formData.set("locationSource", "geolocation");
    formData.set("lat", "51.1282");
    formData.set("lng", "71.4304");
    formData.set("addressLabel", "проспект Мангилик Ел, 12, Астана");
    formData.set("moderationAttempt", "1");

    const response = await POST({
      formData: async () => formData,
    } as Request);

    expect(response.status).toBe(201);
    expect(createReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        locationSource: "geolocation",
        lat: 51.1282,
        lng: 71.4304,
        addressLabel: "проспект Мангилик Ел, 12, Астана",
        manualAddress: undefined,
      }),
    );
  });
});
