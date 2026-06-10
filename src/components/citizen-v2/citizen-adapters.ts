import type { ClusterRecord, ReportRecord } from "@/types";

import {
  formatCitizenCount,
  formatCitizenIssueAddress,
  formatCitizenIssueDistrict,
  formatCitizenIssueDistance,
  formatCitizenIssuePriority,
  formatCitizenIssueStatus,
  formatCitizenIssueTitle,
  formatCitizenReportedAt,
  ISSUE_TITLES,
} from "@/components/citizen-v2/citizen-formatters";

export type CitizenOverviewIssue = {
  id: string;
  title: string;
  address: string;
  district: string;
  statusLabel: string;
  priorityLabel: string;
  distanceLabel: string;
  imageUrl: string;
  category: ClusterRecord["category"];
  description?: string;
  reporterLabel?: string;
  reportedAtLabel?: string;
  notesTitle?: string;
  noteSummary?: string;
  detailsHref?: string;
};

export type CitizenOverviewStat = {
  label: string;
  value: string;
  note: string;
};

function isWithinLastSevenDays(isoDate: string, now: Date): boolean {
  const timestamp = Date.parse(isoDate);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return timestamp >= sevenDaysAgo;
}

export function buildCitizenOverviewStats(
  reports: ReportRecord[],
): CitizenOverviewStat[] {
  const now = new Date();
  const activeNearby = reports.filter((report) => report.status !== "closed").length;
  const solvedThisWeek = reports.filter(
    (report) =>
      report.status === "closed" && isWithinLastSevenDays(report.updatedAt, now),
  ).length;
  const needsVerification = reports.filter(
    (report) => report.reviewStatus === "pending" || report.aiNeedsReview,
  ).length;

  return [
    {
      label: "Active nearby",
      value: formatCitizenCount(activeNearby),
      note: "within 2 km",
    },
    {
      label: "Solved this week",
      value: formatCitizenCount(solvedThisWeek),
      note: "citywide",
    },
    {
      label: "Needs verification",
      value: formatCitizenCount(needsVerification),
      note: "help us confirm",
    },
    {
      label: "Total reports",
      value: formatCitizenCount(reports.length),
      note: "all time",
    },
  ];
}

export function buildCitizenOverviewIssues(
  clusters: ClusterRecord[],
): CitizenOverviewIssue[] {
  return clusters.slice(0, 5).map((cluster) => ({
    id: cluster.id,
    title: formatCitizenIssueTitle(cluster.category),
    address: formatCitizenIssueAddress(cluster.address, cluster.lat, cluster.lng),
    district: formatCitizenIssueDistrict(cluster.district),
    statusLabel: formatCitizenIssueStatus(cluster),
    priorityLabel: formatCitizenIssuePriority(cluster.priorityScore),
    distanceLabel: formatCitizenIssueDistance(cluster.reportCount),
    imageUrl: cluster.representativePhotoUrl ?? "",
    category: cluster.category,
    description: cluster.priorityReason ?? undefined,
    reporterLabel: `${formatCitizenCount(cluster.reportCount)} linked ${cluster.reportCount === 1 ? "report" : "reports"}`,
    reportedAtLabel: formatCitizenReportedAt(cluster.createdAt),
    notesTitle: cluster.topFactors.length > 0 ? "Priority drivers" : undefined,
    noteSummary:
      cluster.topFactors.length > 0
        ? cluster.topFactors.map((factor) => factor.label).join(", ")
        : undefined,
    detailsHref: `/citizen/map?issue=${cluster.id}`,
  }));
}

export { ISSUE_TITLES };
