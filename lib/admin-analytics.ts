import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import type { ClusterRecord, ClusterStatus, ReportCategory, ReportRecord } from "@/types";

type BuildAdminAnalyticsViewModelInput = {
  clusters: ClusterRecord[];
  reports: ReportRecord[];
  now?: string | Date;
};

export type AdminAnalyticsPeriod = "7d" | "30d" | "all";

export type AnalyticsKpi = {
  label: string;
  value: number | string;
  note: string;
};

export type AnalyticsTimelinePoint = {
  date: string;
  label: string;
  count: number;
};

export type AnalyticsCategoryPoint = {
  key: ReportCategory;
  label: string;
  color: string;
  value: number;
  share: number;
};

export type AnalyticsStatusPoint = {
  key: ClusterStatus;
  label: string;
  value: number;
  share: number;
  tone: string;
};

export type AnalyticsDistrictPoint = {
  district: string;
  value: number;
  share: number;
};

export type AnalyticsSeverityPoint = {
  clusterId: string;
  address: string;
  severity: number;
  category: ReportCategory;
};

export type AdminAnalyticsViewModel = {
  kpis: {
    totalReports: AnalyticsKpi;
    activeClusters: AnalyticsKpi;
    resolvedClusters: AnalyticsKpi;
    averageSeverity: AnalyticsKpi;
  };
  timeline: AnalyticsTimelinePoint[];
  categories: AnalyticsCategoryPoint[];
  statuses: AnalyticsStatusPoint[];
  districts: AnalyticsDistrictPoint[];
  severity: AnalyticsSeverityPoint[];
  highlights: {
    topCategory: string;
    topDistrict: string;
    hottestCluster: string;
    closureRate: string;
  };
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function buildAdminAnalyticsViewModel({
  clusters,
  reports,
  now = new Date(),
}: BuildAdminAnalyticsViewModelInput): AdminAnalyticsViewModel {
  const resolvedNow = typeof now === "string" ? new Date(now) : now;
  const totalReports = reports.length;
  const activeClusters = clusters.filter((cluster) => cluster.status !== "closed").length;
  const resolvedClusters = clusters.filter((cluster) => cluster.status === "closed").length;
  const averageSeverity = clusters.length
    ? (clusters.reduce((sum, cluster) => sum + cluster.severity, 0) / clusters.length).toFixed(1)
    : "0.0";
  const timeline = buildTimeline(reports, resolvedNow);
  const categories = buildCategoryTotals(reports);
  const statuses = buildStatusTotals(clusters);
  const districts = buildDistrictTotals(clusters);
  const severity = [...clusters]
    .sort((left, right) => right.severity - left.severity)
    .slice(0, 6)
    .map((cluster) => ({
      clusterId: cluster.id,
      address: cluster.address ?? "Адрес уточняется",
      severity: cluster.severity,
      category: cluster.category,
    }));

  const topCategory = categories.find((item) => item.value > 0)?.label ?? "Нет данных";
  const topDistrict = districts[0]?.district ?? "Нет данных";
  const hottestCluster = severity[0]?.address ?? "Нет данных";
  const closureRate = totalReports === 0 ? "0%" : `${Math.round((resolvedClusters / Math.max(clusters.length, 1)) * 100)}%`;

  return {
    kpis: {
      totalReports: {
        label: "Всего заявок",
        value: totalReports,
        note: "Все обращения в системе",
      },
      activeClusters: {
        label: "Активные кластеры",
        value: activeClusters,
        note: "Открыто или в работе",
      },
      resolvedClusters: {
        label: "Закрытые",
        value: resolvedClusters,
        note: "Уже отработано операторами",
      },
      averageSeverity: {
        label: "Средняя нагрузка",
        value: averageSeverity,
        note: "Средняя нагрузка по кластерам",
      },
    },
    timeline,
    categories,
    statuses,
    districts,
    severity,
    highlights: {
      topCategory,
      topDistrict,
      hottestCluster,
      closureRate,
    },
  };
}

export function filterTimelineByPeriod(
  timeline: AnalyticsTimelinePoint[],
  period: AdminAnalyticsPeriod,
) {
  if (period === "all") {
    return timeline;
  }

  const limit = period === "7d" ? 7 : 30;
  return timeline.slice(-limit);
}

function buildTimeline(reports: ReportRecord[], now: Date) {
  if (reports.length === 0) {
    return [];
  }

  const sorted = [...reports].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  const firstDate = startOfDay(new Date(sorted[0].createdAt));
  const lastReportDate = startOfDay(new Date(sorted[sorted.length - 1].createdAt));
  const lastDate = lastReportDate > startOfDay(now) ? lastReportDate : startOfDay(now);
  const countsByDate = new Map<string, number>();

  for (const report of reports) {
    const key = formatDateKey(new Date(report.createdAt));
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  const points: AnalyticsTimelinePoint[] = [];

  for (let cursor = firstDate.getTime(); cursor <= lastDate.getTime(); cursor += DAY_IN_MS) {
    const date = new Date(cursor);
    const key = formatDateKey(date);

    points.push({
      date: key,
      label: formatShortDate(date),
      count: countsByDate.get(key) ?? 0,
    });
  }

  return points;
}

function buildCategoryTotals(reports: ReportRecord[]) {
  return (Object.entries(CATEGORY_META) as Array<[ReportCategory, (typeof CATEGORY_META)[ReportCategory]]>)
    .map(([key, meta]) => {
      const value = reports.filter((report) => report.userCategory === key).length;

      return {
        key,
        label: meta.label,
        color: meta.color,
        value,
        share: reports.length === 0 ? 0 : value / reports.length,
      };
    })
    .sort((left, right) => right.value - left.value);
}

function buildStatusTotals(clusters: ClusterRecord[]) {
  return (Object.entries(STATUS_META) as Array<[ClusterStatus, (typeof STATUS_META)[ClusterStatus]]>).map(
    ([key, meta]) => {
      const value = clusters.filter((cluster) => cluster.status === key).length;

      return {
        key,
        label: meta.label,
        value,
        share: clusters.length === 0 ? 0 : value / clusters.length,
        tone: meta.tone,
      };
    },
  );
}

function buildDistrictTotals(clusters: ClusterRecord[]) {
  const totals = new Map<string, number>();

  for (const cluster of clusters) {
    if (!cluster.district) {
      continue;
    }

    totals.set(cluster.district, (totals.get(cluster.district) ?? 0) + 1);
  }

  const totalWithDistrict = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  return [...totals.entries()]
    .map(([district, value]) => ({
      district,
      value,
      share: totalWithDistrict === 0 ? 0 : value / totalWithDistrict,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}
