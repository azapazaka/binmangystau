import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminWasteContainersPage from "@/pages/admin/AdminWasteContainersPage";

vi.mock("@/components/maps/CityMap", () => ({
  CityMap: ({
    clusters,
  }: {
    clusters: Array<{ reportCount: number }>;
  }) => (
    <div data-testid="city-map">
      {clusters[0] ? `marker:${clusters[0].reportCount}` : "marker:none"}
    </div>
  ),
}));

const fetchMock = vi.fn();
const geolocationMock = vi.fn();

function mockBridgeResponse(input: {
  ok?: boolean;
  plasticDistanceCm?: number | null;
  plasticFillLevel?: number | null;
  plasticStatus?: "normal" | "warning" | "full" | "offline";
  plasticOffline?: boolean;
  organicDistanceCm?: number | null;
  organicFillLevel?: number | null;
  organicStatus?: "normal" | "warning" | "full" | "offline";
  organicOffline?: boolean;
  readAt?: string;
  error?: string | null;
}) {
  return {
    ok: input.ok ?? true,
    readAt: input.readAt ?? "2026-06-11T12:00:00.000Z",
    sections: {
      plastic: {
        distanceCm: input.plasticDistanceCm ?? 4,
        fillLevel: input.plasticFillLevel ?? 73,
        status: input.plasticStatus ?? "warning",
        isOffline: input.plasticOffline ?? false,
        lastReadAt: input.readAt ?? "2026-06-11T12:00:00.000Z",
      },
      organic: {
        distanceCm:
          input.organicDistanceCm === undefined ? 9 : input.organicDistanceCm,
        fillLevel:
          input.organicFillLevel === undefined ? 40 : input.organicFillLevel,
        status: input.organicStatus ?? "normal",
        isOffline: input.organicOffline ?? false,
        lastReadAt: input.readAt ?? "2026-06-11T12:00:00.000Z",
      },
    },
    error: input.error ?? null,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  geolocationMock.mockReset();
  window.localStorage.clear();

  Object.defineProperty(window, "fetch", {
    configurable: true,
    value: fetchMock,
  });

  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: geolocationMock,
    },
  });
});

describe("AdminWasteContainersPage", () => {
  it("loads live data and browser geolocation on first render", async () => {
    geolocationMock.mockImplementation((success: (value: GeolocationPosition) => void) =>
      success({
        coords: {
          latitude: 43.65001,
          longitude: 51.17002,
        },
      } as GeolocationPosition),
    );
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockBridgeResponse({}),
    });

    render(<AdminWasteContainersPage />);

    await waitFor(() =>
      expect(screen.getAllByText("73%").length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0);
    expect(screen.getByText("Геолокация ноутбука")).toBeInTheDocument();
    expect(screen.getByText("43.65001, 51.17002")).toBeInTheDocument();
    expect(screen.getByTestId("city-map")).toHaveTextContent("marker:73");
  });

  it("refreshes both position and bridge data on button click", async () => {
    geolocationMock
      .mockImplementationOnce((success: (value: GeolocationPosition) => void) =>
        success({
          coords: {
            latitude: 43.65001,
            longitude: 51.17002,
          },
        } as GeolocationPosition),
      )
      .mockImplementationOnce((success: (value: GeolocationPosition) => void) =>
        success({
          coords: {
            latitude: 43.66001,
            longitude: 51.18002,
          },
        } as GeolocationPosition),
      );

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBridgeResponse({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          mockBridgeResponse({
            plasticDistanceCm: 2,
            plasticFillLevel: 87,
            plasticStatus: "full",
            organicDistanceCm: 10,
            organicFillLevel: 33,
            organicStatus: "normal",
          }),
      });

    render(<AdminWasteContainersPage />);

    await waitFor(() =>
      expect(screen.getByText("43.65001, 51.17002")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Обновить данные" }));

    await waitFor(() =>
      expect(screen.getByText("43.66001, 51.18002")).toBeInTheDocument(),
    );
    expect(screen.getAllByText("87%").length).toBeGreaterThan(0);
    expect(screen.getByTestId("city-map")).toHaveTextContent("marker:87");
  });

  it("shows partial offline state when one sensor is missing", async () => {
    geolocationMock.mockImplementation((success: (value: GeolocationPosition) => void) =>
      success({
        coords: {
          latitude: 43.65001,
          longitude: 51.17002,
        },
      } as GeolocationPosition),
    );
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        mockBridgeResponse({
          organicDistanceCm: null,
          organicFillLevel: null,
          organicStatus: "offline",
          organicOffline: true,
        }),
    });

    render(<AdminWasteContainersPage />);

    await waitFor(() =>
      expect(screen.getAllByText("Оффлайн").length).toBeGreaterThan(0),
    );
    expect(screen.getByText("Нет данных")).toBeInTheDocument();
    expect(screen.getAllByText("73%").length).toBeGreaterThan(0);
  });

  it("falls back to stored coordinates and readings when bridge and geolocation fail", async () => {
    window.localStorage.setItem(
      "smart-bin:last-position",
      JSON.stringify({
        lat: 43.64123,
        lng: 51.16543,
        source: "stored",
      }),
    );
    window.localStorage.setItem(
      "smart-bin:last-response",
      JSON.stringify(
        mockBridgeResponse({
          readAt: "2026-06-11T11:50:00.000Z",
        }),
      ),
    );

    geolocationMock.mockImplementation(
      (_success: unknown, error: (value: GeolocationPositionError) => void) =>
        error({ code: 1 } as GeolocationPositionError),
    );
    fetchMock.mockRejectedValue(new Error("Bridge offline"));

    render(<AdminWasteContainersPage />);

    await waitFor(() =>
      expect(screen.getByText("Последняя известная точка")).toBeInTheDocument(),
    );
    expect(screen.getByText("43.64123, 51.16543")).toBeInTheDocument();
    expect(screen.getByText("Bridge offline")).toBeInTheDocument();
    expect(screen.getAllByText("73%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0);
  });
});
