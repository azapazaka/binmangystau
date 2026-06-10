import type { CitizenLeaderboardEntry, CitizenSummary, ReportRecord } from "@/types";

export function getCitizenReports(reports: ReportRecord[], citizenId: string) {
  return reports
    .filter((report) => report.submittedBy === citizenId)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

export function getCitizenSummary(
  reports: ReportRecord[],
  citizenId: string,
): CitizenSummary {
  const citizenReports = getCitizenReports(reports, citizenId);
  const leaderboard = buildCitizenLeaderboard(reports);
  const currentEntry =
    leaderboard.find((entry) => entry.citizenId === citizenId) ?? null;

  return {
    totalReports: citizenReports.length,
    resolvedReports: citizenReports.filter((report) => report.status === "closed").length,
    activityScore: currentEntry?.activityScore ?? 0,
    currentRank: currentEntry?.rank ?? null,
  };
}

export function getRecentCitizenReportsCount(
  reports: ReportRecord[],
  citizenId: string,
  days: number,
) {
  const citizenReports = getCitizenReports(reports, citizenId);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffTime = cutoff.getTime();

  return citizenReports.filter((report) => new Date(report.createdAt).getTime() >= cutoffTime).length;
}

export function buildCitizenLeaderboard(reports: ReportRecord[]) {
  const grouped = new Map<string, ReportRecord[]>();

  reports.forEach((report) => {
    if (!report.submittedBy) {
      return;
    }

    const existing = grouped.get(report.submittedBy) ?? [];
    existing.push(report);
    grouped.set(report.submittedBy, existing);
  });

  return [...grouped.entries()]
    .map(([citizenId, citizenReports]) => createLeaderboardEntry(citizenId, citizenReports))
    .sort((left, right) => right.activityScore - left.activityScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function createLeaderboardEntry(
  citizenId: string,
  reports: ReportRecord[],
): Omit<CitizenLeaderboardEntry, "rank"> {
  const resolvedReports = reports.filter((report) => report.status === "closed").length;
  const totalReports = reports.length;

  return {
    citizenId,
    totalReports,
    resolvedReports,
    activityScore: totalReports * 5 + resolvedReports * 14,
  };
}
