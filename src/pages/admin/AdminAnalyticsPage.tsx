import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Gauge,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { listClusters, listReports } from "@/lib/api";
import { CATEGORY_META } from "@/lib/constants";
import type { ClusterRecord, ReportCategory, ReportRecord } from "@/types";

const CATEGORY_ORDER: ReportCategory[] = [
  "road",
  "light",
  "trash",
  "traffic",
  "other",
];

function startOfDayKey(dateString: string) {
  return format(new Date(dateString), "yyyy-MM-dd");
}

export default function AdminAnalyticsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listReports(), listClusters({ category: "all" })])
      .then(([nextReports, nextClusters]) => {
        if (cancelled) return;
        setReports(nextReports);
        setClusters(nextClusters);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Не удалось загрузить аналитику.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryBreakdown = useMemo(() => {
    return CATEGORY_ORDER.map((category) => {
      const count = reports.filter(
        (report) => (report.aiCategory ?? report.userCategory) === category,
      ).length;
      return {
        name: CATEGORY_META[category].label,
        value: count,
        color: CATEGORY_META[category].color,
      };
    });
  }, [reports]);

  const districtLoad = useMemo(() => {
    const districtMap = new Map<string, number>();
    for (const cluster of clusters) {
      const key = cluster.district ?? "Без района";
      districtMap.set(key, (districtMap.get(key) ?? 0) + cluster.reportCount);
    }

    return [...districtMap.entries()]
      .map(([district, volume]) => ({ district, volume }))
      .sort((left, right) => right.volume - left.volume)
      .slice(0, 6);
  }, [clusters]);

  const dailyTrend = useMemo(() => {
    const reportMap = new Map<string, number>();
    const closedMap = new Map<string, number>();

    for (let index = 0; index < 7; index += 1) {
      const date = subDays(new Date(), 6 - index);
      const key = format(date, "yyyy-MM-dd");
      reportMap.set(key, 0);
      closedMap.set(key, 0);
    }

    for (const report of reports) {
      const key = startOfDayKey(report.createdAt);
      if (reportMap.has(key)) reportMap.set(key, (reportMap.get(key) ?? 0) + 1);
    }

    for (const cluster of clusters) {
      if (cluster.status !== "closed") continue;
      const key = startOfDayKey(cluster.updatedAt);
      if (closedMap.has(key)) closedMap.set(key, (closedMap.get(key) ?? 0) + 1);
    }

    return [...reportMap.keys()].map((key) => ({
      day: format(new Date(key), "EEE", { locale: ru }),
      reports: reportMap.get(key) ?? 0,
      resolved: closedMap.get(key) ?? 0,
    }));
  }, [clusters, reports]);

  const summary = useMemo(() => {
    const totalReports = reports.length;
    const totalClusters = clusters.length;
    const highPriority = clusters.filter(
      (cluster) => cluster.priorityScore >= 65,
    ).length;
    const aiCoverage = totalReports
      ? Math.round(
          (reports.filter((report) => report.aiValidationStatus !== "unavailable")
            .length /
            totalReports) *
            100,
        )
      : 0;

    return [
      {
        label: "Заявок в системе",
        value: totalReports,
        note: "по всем категориям",
        icon: <BarChart3 size={18} />,
      },
      {
        label: "Активные точки",
        value: totalClusters,
        note: "отдельные локации",
        icon: <Activity size={18} />,
      },
      {
        label: "Высокий приоритет",
        value: highPriority,
        note: "балл выше 65",
        icon: <Gauge size={18} />,
      },
      {
        label: "Покрытие AI",
        value: `${aiCoverage}%`,
        note: "есть AI-классификация",
        icon: <Sparkles size={18} />,
      },
    ];
  }, [clusters, reports]);

  return (
    <div className="space-y-4">
      <header>
        <p className="citizen-v2-eyebrow">Аналитика</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Аналитика
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Краткая сводка по нагрузке, категориям и качеству обработки.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <article key={item.label} className="citizen-v2-panel flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {item.note}
              </p>
            </div>
          </article>
        ))}
      </section>

      {loading ? (
        <div className="citizen-v2-panel flex min-h-72 items-center justify-center text-sm text-slate-500">
          <LoaderCircle className="mr-2 animate-spin" size={16} />
          Загрузка аналитики...
        </div>
      ) : error ? (
        <div className="citizen-v2-panel rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <section className="citizen-v2-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="citizen-v2-eyebrow">Динамика</p>
                <h2>Новые и закрытые</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                <CheckCircle2 size={12} />
                Последние 7 дней
              </div>
            </div>
            <div className="mt-5" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend} barGap={10}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="reports" fill="#0f766e" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="resolved" fill="#94a3b8" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="citizen-v2-panel">
            <p className="citizen-v2-eyebrow">Категории</p>
            <h2>Распределение сигналов</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {categoryBreakdown.map((entry) => (
                  <div key={entry.name} className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.name}
                      </p>
                    </div>
                    <p className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950">
                      {entry.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="citizen-v2-panel xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="citizen-v2-eyebrow">Районы</p>
                <h2>Где больше всего заявок</h2>
              </div>
              <p className="text-xs text-slate-500">
                По числу заявок в кластерах
              </p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {districtLoad.map((district) => (
                <article
                  key={district.district}
                  className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-500">
                    {district.district}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    {district.volume}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    заявок в этом районе
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
