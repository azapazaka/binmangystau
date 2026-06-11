import type { ClusterRecord, ReportCategory } from "@/types";

export const ISSUE_TITLES: Record<ReportCategory, string> = {
  road: "Повреждение дороги",
  light: "Не работает фонарь",
  trash: "Переполненный контейнер",
  traffic: "Опасный участок",
  other: "Городская заявка",
};

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatCitizenCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
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
  return district ?? "Район не указан";
}

export function formatCitizenIssuePriority(priorityScore: number): string {
  if (priorityScore > 66) {
    return "Высокий";
  }

  if (priorityScore > 33) {
    return "Средний";
  }

  return "Низкий";
}

export function formatCitizenIssueStatus(
  cluster: Pick<ClusterRecord, "status" | "moderatorReviewStatus">,
): string {
  if (cluster.status === "closed") {
    return "Закрыто";
  }

  if (cluster.status === "in_progress") {
    return "В работе";
  }

  if (
    cluster.moderatorReviewStatus === "confirmed" ||
    cluster.moderatorReviewStatus === "corrected"
  ) {
    return "Проверено";
  }

  return "На проверке";
}

export function formatCitizenIssueDistance(reportCount: number): string {
  return `${formatCitizenCount(reportCount)} рядом`;
}

export function formatCitizenReportedAt(isoDate: string): string | undefined {
  const timestamp = Date.parse(isoDate);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return dateTimeFormatter.format(new Date(timestamp)).replace(",", "");
}
