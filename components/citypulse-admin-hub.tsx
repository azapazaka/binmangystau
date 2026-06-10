"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  formatLastSeen,
  getBinStatusLabel,
  getCityPulseAlertSummary,
} from "@/lib/citypulse-admin-ui";
import type {
  CityPulseAnalytics,
  CityPulseDemoAction,
  CityPulseMode,
  ClusterStatus,
  SmartBinRecord,
} from "@/types";

import { CityPulseBinMap } from "./citypulse-bin-map";

type AdminTab = "reports" | "map" | "analytics";

type ReportQueueItem = {
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
};

type ReportsSnapshot = {
  totalReports: number;
  activeClusters: number;
  resolvedClusters: number;
  reviewedReports: number;
};

type CityPulseAdminHubProps = {
  initialTab: AdminTab;
  reports: ReportQueueItem[];
  reportStats: ReportsSnapshot;
  bins: SmartBinRecord[];
  analytics: CityPulseAnalytics;
  mode: CityPulseMode;
};

const TAB_META: Array<{ key: AdminTab; label: string }> = [
  { key: "reports", label: "Обращения" },
  { key: "map", label: "Карта" },
  { key: "analytics", label: "Логистика" },
];

const TAB_HEADER: Record<
  AdminTab,
  { kicker: string; title: string; subtitle: string }
> = {
  reports: {
    kicker: "CityPulse / Обращения",
    title: "Очередь обращений",
    subtitle: "Список, район, приоритет.",
  },
  map: {
    kicker: "CityPulse / IoT",
    title: "Карта контейнеров",
    subtitle: "Статус, сигнал, offline.",
  },
  analytics: {
    kicker: "CityPulse / Логистика",
    title: "Маршрут и сводка",
    subtitle: "Приоритетные баки и загрузка.",
  },
};

export function CityPulseAdminHub({
  initialTab,
  reports,
  reportStats,
  bins: initialBins,
  analytics: initialAnalytics,
  mode: initialMode,
}: CityPulseAdminHubProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [bins, setBins] = useState(initialBins);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [mode, setMode] = useState<CityPulseMode>(initialMode);
  const [message, setMessage] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const header = TAB_HEADER[tab];
  const alertSummary = useMemo(() => getCityPulseAlertSummary(bins), [bins]);
  const activeAlerts = bins.filter((bin) => bin.status === "fire" || bin.status === "sos").length;

  function handleTabChange(nextTab: AdminTab) {
    setTab(nextTab);
    router.replace(`/admin?tab=${nextTab}`);
  }

  function handleModeChange(nextMode: CityPulseMode) {
    startTransition(async () => {
      const response = await fetch("/api/admin/demo/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode }),
      });

      if (!response.ok) {
        setMessage("Не удалось переключить режим.");
        return;
      }

      const payload = (await response.json()) as {
        mode: CityPulseMode;
        bins: SmartBinRecord[];
        analytics: CityPulseAnalytics;
      };

      setMode(payload.mode);
      setBins(payload.bins);
      setAnalytics(payload.analytics);
      setMessage(nextMode === "live" ? "Режим: live" : "Режим: simulation");
    });
  }

  function handleDemoAction(action: CityPulseDemoAction) {
    startTransition(async () => {
      const response = await fetch("/api/admin/demo/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        setMessage("Событие не применилось.");
        return;
      }

      const payload = (await response.json()) as {
        mode: CityPulseMode;
        bins: SmartBinRecord[];
        analytics: CityPulseAnalytics;
      };

      setMode(payload.mode);
      setBins(payload.bins);
      setAnalytics(payload.analytics);
      setMessage(getActionMessage(action));
    });
  }

  return (
    <div className="grid gap-6">
      <section className="panel-surface overflow-hidden rounded-[2.2rem] p-6 md:p-8">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-[-8%] top-[-32px] h-44 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.18)_0%,_rgba(14,165,233,0)_68%)] blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div>
              <p className="panel-kicker text-xs uppercase tracking-[0.34em]">{header.kicker}</p>
              <h1 className="panel-title mt-3 text-5xl leading-[0.94] md:text-6xl">{header.title}</h1>
              <p className="panel-copy mt-4 max-w-3xl text-base leading-8">{header.subtitle}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                {TAB_META.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabChange(item.key)}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition duration-200 ${
                      tab === item.key ? "panel-primary-button" : "panel-secondary-button"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.9),rgba(14,20,34,0.76))] p-5 text-white shadow-[0_24px_60px_rgba(2,6,23,0.34)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Сигнал</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    activeAlerts > 0 ? "bg-rose-500/20 text-rose-200 citypulse-alert-chip" : "bg-emerald-500/20 text-emerald-200"
                  }`}>
                    {activeAlerts > 0 ? "тревога" : "норма"}
                  </span>
                </div>
                <p className="mt-4 text-lg font-semibold">{alertSummary}</p>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,78,110,0.24),rgba(10,15,26,0.8))] p-5 text-white shadow-[0_20px_60px_rgba(2,6,23,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Режим</span>
                  <span className="rounded-full bg-sky-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100">
                    {mode}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("live")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mode === "live" ? "panel-primary-button" : "panel-secondary-button"
                    }`}
                  >
                    live
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("simulation")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mode === "simulation" ? "panel-primary-button" : "panel-secondary-button"
                    }`}
                  >
                    simulation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <section className="panel-muted-card rounded-[1.6rem] px-5 py-4 text-sm font-medium">
          {message}
        </section>
      ) : null}

      <div
        className="min-h-[520px] transition duration-300 data-[pending=true]:opacity-80"
        data-pending={pending}
      >
        {tab === "reports" ? <ReportsTab reports={reports} stats={reportStats} /> : null}
        {tab === "map" ? <MapTab bins={bins} mode={mode} onAction={handleDemoAction} /> : null}
        {tab === "analytics" ? <AnalyticsTab analytics={analytics} /> : null}
      </div>
    </div>
  );
}

function ReportsTab({
  reports,
  stats,
}: {
  reports: ReportQueueItem[];
  stats: ReportsSnapshot;
}) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Всего", value: stats.totalReports, note: "обращений" },
          { label: "Активные", value: stats.activeClusters, note: "в работе" },
          { label: "Закрыто", value: stats.resolvedClusters, note: "готово" },
          { label: "Проверено", value: stats.reviewedReports, note: "модератором" },
        ].map((item) => (
          <article key={item.label} className="panel-surface rounded-[1.8rem] p-5">
            <p className="panel-kicker text-xs uppercase tracking-[0.3em]">{item.label}</p>
            <p className="panel-title mt-4 text-4xl font-semibold">{item.value}</p>
            <p className="panel-copy mt-3 text-sm">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel-surface rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Очередь</p>
              <h2 className="panel-section-title mt-2 text-3xl font-semibold">Обращения</h2>
            </div>
            <span className="rounded-full bg-[var(--panel-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              Сводка
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {reports.map((report) => (
              <article key={report.id} className="panel-muted-card rounded-[1.55rem] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[var(--panel-surface-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
                    {getClusterStatusLabel(report.status)}
                  </span>
                  <span className="rounded-full bg-[rgba(14,165,233,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                    приоритет {report.priorityScore}
                  </span>
                  <span className="panel-copy text-xs uppercase tracking-[0.18em]">
                    {report.reportCount} жалоб
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="panel-section-title text-lg font-semibold">{report.title}</h3>
                    <p className="panel-copy mt-2 text-sm">{report.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="panel-kicker text-[11px] uppercase tracking-[0.2em]">Район</p>
                    <p className="panel-section-title mt-2 text-sm font-semibold">{report.district}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.2rem] bg-[var(--panel-surface-strong)] px-3 py-3">
                    <p className="panel-kicker text-[11px] uppercase tracking-[0.18em]">Кратко</p>
                    <p className="mt-2 text-sm leading-6">{report.aiSummary}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[var(--panel-surface-strong)] px-3 py-3">
                    <p className="panel-kicker text-[11px] uppercase tracking-[0.18em]">Связка</p>
                    <p className="mt-2 text-sm leading-6">{report.clusterHint}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[var(--panel-surface-strong)] px-3 py-3">
                    <p className="panel-kicker text-[11px] uppercase tracking-[0.18em]">Причина</p>
                    <p className="mt-2 text-sm leading-6">{report.priorityHint}</p>
                  </div>
                </div>

                <p className="panel-copy mt-4 text-xs uppercase tracking-[0.18em]">
                  Обновлено {formatLastSeen(report.updatedAt)}
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel-surface rounded-[2rem] p-5">
          <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Пояснение</p>
          <h2 className="panel-section-title mt-2 text-3xl font-semibold">Как читать список</h2>
          <div className="mt-6 grid gap-3">
            {[
              "Верхние карточки показывают общий объем.",
              "Приоритет показывает, что смотреть первым.",
              "Связка показывает похожие обращения рядом.",
              "Причина объясняет, почему кейс поднялся выше.",
            ].map((line) => (
              <div key={line} className="panel-muted-card rounded-[1.35rem] p-4 text-sm leading-7">
                {line}
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href="/admin?tab=map"
              className="panel-primary-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Открыть карту
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function MapTab({
  bins,
  mode,
  onAction,
}: {
  bins: SmartBinRecord[];
  mode: CityPulseMode;
  onAction: (action: CityPulseDemoAction) => void;
}) {
  const counts = {
    green: bins.filter((bin) => bin.status === "normal" && bin.fillLevel <= 50).length,
    yellow: bins.filter(
      (bin) => bin.status === "warning" || (bin.fillLevel >= 51 && bin.fillLevel <= 80),
    ).length,
    red: bins.filter(
      (bin) => ["full", "fire", "sos"].includes(bin.status) || bin.fillLevel >= 81,
    ).length,
    offline: bins.filter((bin) => bin.status === "offline").length,
  };

  return (
    <div className="grid gap-6">
      <section className="panel-surface rounded-[2rem] p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Карта</p>
            <h2 className="panel-title mt-2 text-4xl leading-none md:text-5xl">Контейнеры Актау</h2>
            <p className="panel-copy mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Зеленый, желтый, красный. Offline отдельно.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { action: "fire", label: "Пожар" },
              { action: "sos", label: "SOS" },
              { action: "fill_up", label: "Заполнить" },
              { action: "reset", label: "Сброс" },
            ].map((item) => (
              <button
                key={item.action}
                type="button"
                onClick={() => onAction(item.action as CityPulseDemoAction)}
                className="panel-secondary-button rounded-full px-4 py-2 text-sm font-semibold"
              >
                {item.label}
              </button>
            ))}
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              {mode}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Green", value: counts.green, tone: "bg-emerald-500" },
            { label: "Yellow", value: counts.yellow, tone: "bg-yellow-400" },
            { label: "Red", value: counts.red, tone: "bg-red-500" },
            { label: "Offline", value: counts.offline, tone: "bg-slate-500" },
          ].map((item) => (
            <article key={item.label} className="panel-muted-card rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`block h-3.5 w-3.5 rounded-full ${item.tone}`} />
                  <p className="panel-section-title text-sm font-semibold">{item.label}</p>
                </div>
                <span className="panel-title text-3xl font-semibold">{item.value}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CityPulseBinMap bins={bins} />
    </div>
  );
}

function AnalyticsTab({ analytics }: { analytics: CityPulseAnalytics }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.kpis.map((item) => (
          <article key={item.label} className="panel-surface rounded-[1.8rem] p-5">
            <p className="panel-kicker text-xs uppercase tracking-[0.3em]">{item.label}</p>
            <p className="panel-title mt-4 text-4xl font-semibold">{item.value}</p>
            <p className="panel-copy mt-3 text-sm">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="panel-surface rounded-[2rem] p-5">
          <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Маршрут</p>
          <h2 className="panel-section-title mt-2 text-3xl font-semibold">Вывоз</h2>
          <p className="panel-copy mt-4 text-base leading-8">{analytics.routePlan.summary}</p>
          <div className="mt-5 grid gap-3">
            {analytics.routePlan.stops.map((stop) => (
              <div key={stop} className="panel-muted-card rounded-[1.35rem] p-4 text-sm font-semibold">
                {stop}
              </div>
            ))}
          </div>
        </article>

        <article className="panel-surface rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Приоритет</p>
              <h2 className="panel-section-title mt-2 text-3xl font-semibold">Список баков</h2>
            </div>
            <button type="button" className="panel-primary-button rounded-full px-5 py-3 text-sm font-semibold">
              Обновить
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {analytics.priorities.map((item) => (
              <div key={item.binId} className="panel-muted-card rounded-[1.45rem] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="panel-section-title text-base font-semibold">
                      {item.label} · {item.district}
                    </p>
                    <p className="panel-copy mt-2 text-sm">{item.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="rounded-full bg-[var(--panel-surface-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                      {getBinStatusLabel(item.status)}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{item.fillLevel}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel-surface rounded-[2rem] p-5">
          <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Типы</p>
          <h2 className="panel-section-title mt-2 text-3xl font-semibold">Отходы</h2>
          <div className="mt-6">
            <BarChart
              items={analytics.wasteBreakdown}
              gradient="linear-gradient(90deg,#22c55e,#0ea5e9)"
              suffix=" контейнеров"
            />
          </div>
        </article>

        <article className="panel-surface rounded-[2rem] p-5">
          <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Районы</p>
          <h2 className="panel-section-title mt-2 text-3xl font-semibold">Заполненность</h2>
          <div className="mt-6">
            <BarChart
              items={analytics.districtLoad}
              gradient="linear-gradient(90deg,#facc15,#f97316)"
              suffix="%"
            />
          </div>
        </article>
      </section>

      <section className="panel-surface rounded-[2rem] p-5">
        <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Динамика</p>
        <h2 className="panel-section-title mt-2 text-3xl font-semibold">Инциденты</h2>
        <div className="mt-6">
          <TrendLine items={analytics.incidentTrend} />
        </div>
      </section>
    </div>
  );
}

function BarChart({
  items,
  gradient,
  suffix,
}: {
  items: Array<{ label: string; value: number }>;
  gradient: string;
  suffix: string;
}) {
  const peak = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="panel-muted-card rounded-[1.4rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="panel-section-title text-sm font-semibold">{item.label}</span>
            <span className="panel-copy text-sm">
              {item.value}
              {suffix}
            </span>
          </div>
          <div className="mt-4 h-3 rounded-full bg-white/45">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.value / peak) * 100}%`,
                background: gradient,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendLine({ items }: { items: Array<{ label: string; value: number }> }) {
  if (items.length === 0) {
    return null;
  }

  const width = 760;
  const height = 260;
  const paddingX = 24;
  const paddingY = 24;
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2 - 28;
  const stepX = items.length === 1 ? 0 : chartWidth / (items.length - 1);
  const points = items
    .map((item, index) => {
      const x = paddingX + index * stepX;
      const y = paddingY + chartHeight - (item.value / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="panel-muted-card rounded-[1.8rem] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full" role="img" aria-label="Динамика инцидентов">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingY + chartHeight * ratio;
          return (
            <line
              key={ratio}
              x1={paddingX}
              x2={paddingX + chartWidth}
              y1={y}
              y2={y}
              stroke="rgba(148,163,184,0.18)"
              strokeDasharray="4 8"
            />
          );
        })}
        <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => {
          const x = paddingX + index * stepX;
          const y = paddingY + chartHeight - (item.value / maxValue) * chartHeight;
          return (
            <g key={item.label}>
              <circle cx={x} cy={y} r="6" fill="#f8fafc" stroke="#38bdf8" strokeWidth="3" />
              <text x={x} y={height - 10} textAnchor="middle" fill="currentColor" fontSize="12">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function getClusterStatusLabel(status: ClusterStatus) {
  switch (status) {
    case "open":
      return "Открыто";
    case "in_progress":
      return "В работе";
    case "closed":
      return "Закрыто";
  }
}

function getActionMessage(action: CityPulseDemoAction) {
  switch (action) {
    case "fire":
      return "Пожар включен.";
    case "sos":
      return "SOS включен.";
    case "fill_up":
      return "Контейнер заполнен.";
    case "reset":
      return "Состояние сброшено.";
  }
}
