import type { ClusterRecord, ReportCategory } from "@/types";

export const ISSUE_TITLES: Record<ReportCategory, string> = {
  road: "Road Damage",
  light: "Broken Street Light",
  trash: "Overflowing Bin",
  traffic: "Traffic Hazard",
  other: "Community Report",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatCitizenCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCitizenIssueTitle(category: ReportCategory): string {
  return ISSUE_TITLES[category];
}

export function formatCitizenIssueAddress(
  address: string | null,
  lat: number,
  lng: number,
): string {
  return address ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function formatCitizenIssueDistrict(district: string | null): string {
  return district ?? "District unavailable";
}

export function formatCitizenIssuePriority(priorityScore: number): string {
  if (priorityScore > 66) {
    return "High priority";
  }

  if (priorityScore > 33) {
    return "Medium priority";
  }

  return "Low priority";
}

export function formatCitizenIssueStatus(
  cluster: Pick<ClusterRecord, "status" | "moderatorReviewStatus">,
): string {
  if (cluster.status === "closed") {
    return "Resolved";
  }

  if (cluster.status === "in_progress") {
    return "In progress";
  }

  if (
    cluster.moderatorReviewStatus === "confirmed" ||
    cluster.moderatorReviewStatus === "corrected"
  ) {
    return "Reviewed";
  }

  return "Under review";
}

export function formatCitizenIssueDistance(reportCount: number): string {
  return `${formatCitizenCount(reportCount)} report${reportCount === 1 ? "" : "s"} nearby`;
}

export function formatCitizenReportedAt(isoDate: string): string | undefined {
  const timestamp = Date.parse(isoDate);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return dateTimeFormatter.format(new Date(timestamp)).replace(",", "");
}
