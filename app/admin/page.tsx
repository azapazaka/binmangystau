import { CityPulseAdminHub } from "@/components/citypulse-admin-hub";
import { getCityPulseAnalytics, getCityPulseMode, listSmartBins } from "@/lib/citypulse-admin";
import { getDashboardStats, listClusters, listReports } from "@/lib/data-store";
import { isSupabaseConfigured } from "@/lib/env";
import type { ClusterStatus } from "@/types";

type AdminSearchParams = Promise<{
  tab?: string | string[];
}>;

const VALID_TABS = new Set(["reports", "map", "analytics"]);

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: AdminSearchParams;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const requestedTab = Array.isArray(resolvedParams?.tab)
    ? resolvedParams?.tab[0]
    : resolvedParams?.tab;
  const initialTab = VALID_TABS.has(requestedTab ?? "")
    ? (requestedTab as "reports" | "map" | "analytics")
    : "reports";

  const reportFeed = isSupabaseConfigured()
    ? await loadSupabaseReportFeed()
    : loadDemoReportFeed();

  return (
    <CityPulseAdminHub
      initialTab={initialTab}
      reports={reportFeed.queue}
      reportStats={reportFeed.stats}
      bins={listSmartBins()}
      analytics={getCityPulseAnalytics()}
      mode={getCityPulseMode()}
    />
  );
}

async function loadSupabaseReportFeed() {
  const [stats, clusters, reports] = await Promise.all([
    getDashboardStats(),
    listClusters({ period: "all" }),
    listReports(),
  ]);

  const reportsByClusterId = new Map(
    reports.map((report) => [report.clusterId, report] as const),
  );

  return {
    stats: {
      totalReports: stats.totalReports,
      activeClusters: clusters.filter((cluster) => cluster.status !== "closed").length,
      resolvedClusters: stats.resolved,
      reviewedReports: stats.reviewedReports,
    },
    queue: clusters.slice(0, 8).map((cluster) => {
      const report = reportsByClusterId.get(cluster.id);

      return {
        id: cluster.id,
        title: getIssueTitle(cluster.status, cluster.priorityScore),
        district: cluster.district ?? "Актау",
        address: cluster.address ?? "Адрес уточняется",
        status: cluster.status,
        priorityScore: cluster.priorityScore,
        reportCount: cluster.reportCount,
        aiSummary:
          report?.aiDeepAnalysis?.summary ??
          report?.aiReason ??
          cluster.priorityReason ??
          "AI отметил обращение как рабочий кейс для модератора.",
        clusterHint: `${cluster.reportCount} связанных жалоб в одном кластере`,
        priorityHint:
          cluster.priorityReason ??
          `Приоритет ${cluster.priorityScore} по плотности обращений и свежести сигнала`,
        updatedAt: cluster.updatedAt,
      };
    }),
  };
}

function loadDemoReportFeed() {
  const now = new Date().toISOString();
  const demoReports: Array<{
    id: string;
    title: string;
    district: string;
    address: string;
    status: ClusterStatus;
    priorityScore: number;
    reportCount: number;
    aiSummary: string;
    clusterHint: string;
    priorityHint: string;
    updatedAt: string;
  }> = [
    {
      id: "cluster-demo-1",
      title: getIssueTitle("open", 92),
      district: "14 мкр",
      address: "14 мкр, у контейнерной площадки",
      status: "open",
      priorityScore: 92,
      reportCount: 5,
      aiSummary: "Переполнение у жилого блока, мусор уже выходит за площадку.",
      clusterHint: "5 связанных жалоб в одном кластере",
      priorityHint: "Серия обращений у прибрежной линии, нужен быстрый вывоз",
      updatedAt: now,
    },
    {
      id: "cluster-demo-2",
      title: getIssueTitle("in_progress", 78),
      district: "11 мкр",
      address: "11 мкр, двор у школы",
      status: "in_progress",
      priorityScore: 78,
      reportCount: 3,
      aiSummary: "Жилой двор с нарастающей нагрузкой, нужен приоритетный контроль.",
      clusterHint: "3 связанных жалобы в одном кластере",
      priorityHint: "Повторные жалобы и близость к жилому двору",
      updatedAt: now,
    },
    {
      id: "cluster-demo-3",
      title: getIssueTitle("open", 66),
      district: "Промзона",
      address: "Промзона, подъезд к полигону",
      status: "open",
      priorityScore: 66,
      reportCount: 2,
      aiSummary: "Точка у полигона, где отходы разносит ветром на подъездную зону.",
      clusterHint: "2 связанные жалобы в одном кластере",
      priorityHint: "Есть риск разлета отходов из-за ветра",
      updatedAt: now,
    },
  ];

  return {
    stats: {
      totalReports: 18,
      activeClusters: 7,
      resolvedClusters: 6,
      reviewedReports: 11,
    },
    queue: demoReports,
  };
}

function getIssueTitle(status: ClusterStatus, priorityScore: number) {
  if (status === "in_progress") {
    return `Кластер на контроле · priority ${priorityScore}`;
  }

  if (status === "closed") {
    return `Закрытый кейс · priority ${priorityScore}`;
  }

  return `Новый кластер · priority ${priorityScore}`;
}
