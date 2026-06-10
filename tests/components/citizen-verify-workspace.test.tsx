import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CitizenVerifyWorkspace } from "@/components/citizen-verify-workspace";
import type { ReportRecord } from "@/types";

vi.mock("next/image", () => ({
  default: ({
    alt,
    fill,
    unoptimized,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => {
    void fill;
    void unoptimized;
    return <img alt={alt ?? ""} {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const baseReport: ReportRecord = {
  id: "report-1",
  clusterId: "cluster-1",
  userCategory: "road",
  description: "Broken asphalt near the bus stop",
  photoUrl: "https://cdn.citypulse.test/report-1.jpg",
  lat: 43.24,
  lng: 76.89,
  address: "Абая 10",
  district: "Алмалинский",
  severity: 4,
  priorityScore: 12,
  priorityReason: "Priority",
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
  aiConfidence: 0.82,
  aiTags: [],
  aiValidationStatus: "uncertain",
  aiNeedsReview: true,
  aiReason: "Needs review",
  aiVisualSeverity: "medium",
  aiDeepAnalysis: null,
  aiDeepAnalyzedAt: null,
  aiRaw: null,
  humanRealVotes: 0,
  humanFakeVotes: 0,
  humanVotesTotal: 0,
  humanConfirmationStatus: "pending",
  humanLastVotedAt: null,
  submittedBy: "citizen@citypulse.local",
  createdAt: "2026-04-05T09:00:00.000Z",
  updatedAt: "2026-04-05T09:00:00.000Z",
};

describe("CitizenVerifyWorkspace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a real vote and moves to the empty state", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report: { ...baseReport, humanVotesTotal: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reports: [] }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <CitizenVerifyWorkspace
        initialReports={[baseReport]}
        citizenName="Гражданин"
        isDemoCitizen={false}
      />,
    );

    const realButton = screen
      .getAllByRole("button")
      .find((element) => element.tagName === "BUTTON" && element.textContent?.includes("Реально"));

    expect(realButton).toBeTruthy();
    await user.click(realButton!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reports/report-1/human-vote",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    expect(await screen.findByText("На сейчас всё просмотрено")).toBeInTheDocument();
  });

  it("lets the demo citizen replay the queue from the empty state", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reports: [baseReport] }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <CitizenVerifyWorkspace initialReports={[]} citizenName="Демо-гражданин" isDemoCitizen />,
    );

    await user.click(screen.getByRole("button", { name: /показать демо-очередь заново/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reports/verify-queue?limit=6&includeReviewed=1",
      );
    });

    expect(await screen.findByText("Абая 10")).toBeInTheDocument();
  });
});
