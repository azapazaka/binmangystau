import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "clusters") {
        return {
          update: updateMock,
        };
      }

      if (table === "report_human_votes") {
        return {
          upsert: upsertMock,
        };
      }

      return {
        insert: insertMock,
      };
    }),
  },
}));

function createImageFile() {
  return new File(["demo-image"], "report.jpg", { type: "image/jpeg" });
}

describe("createReport", () => {
  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    uploadMock.mockReset();
    getPublicUrlMock.mockReset();
    insertMock.mockReset();
    updateMock.mockReset();
    upsertMock.mockReset();

    getPublicUrlMock.mockReturnValue({
      data: {
        publicUrl: "https://cdn.citypulse.test/report.jpg",
      },
    });
  });

  it("fails with a clear auth message before uploading when no authenticated user is present", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { createReport } = await import("@/lib/api");

    await expect(
      createReport({
        photo: createImageFile(),
        userCategory: "other",
        description: "Broken bench",
        lat: 43.238949,
        lng: 76.889709,
        address: "Aktau",
        submittedBy: "user-1",
      }),
    ).rejects.toThrow("Your session expired. Sign in again and resubmit the report.");

    expect(uploadMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("uploads and inserts when the authenticated user matches the report submitter", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
        },
      },
      error: null,
    });
    uploadMock.mockResolvedValue({ error: null });
    insertMock.mockResolvedValue({ error: null });

    const { createReport } = await import("@/lib/api");

    await expect(
      createReport({
        photo: createImageFile(),
        userCategory: "other",
        description: "Broken bench",
        lat: 43.238949,
        lng: 76.889709,
        address: "Aktau",
        submittedBy: "user-1",
      }),
    ).resolves.toBeUndefined();

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
