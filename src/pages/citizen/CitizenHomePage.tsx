import {
  Activity,
  ArrowRight,
  BarChart3,
  CircleCheck,
  LoaderCircle,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import type { CitizenOverviewIssue } from "@/components/citizen-v2/citizen-adapters";
import { CitizenIssueDetailRail } from "@/components/citizen-v2/CitizenIssueDetailRail";
import { CitizenMetricCard } from "@/components/citizen-v2/CitizenMetricCard";
import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import { CityMap } from "@/components/maps/CityMap";
import { useCitizenOverviewData } from "@/hooks/useCitizenOverviewData";

const CATEGORY_FILTERS = [
  { label: "Все", category: null, color: null },
  { label: "Дороги", category: "road", color: "#ef4444" },
  { label: "Освещение", category: "light", color: "#f59e0b" },
  { label: "Мусор", category: "trash", color: "#22c55e" },
  { label: "Трафик", category: "traffic", color: "#3b82f6" },
  { label: "Другое", category: "other", color: "#94a3b8" },
] as const;

const CATEGORY_DISPLAY: Record<string, { label: string; color: string }> = {
  road: { label: "Дороги", color: "#ef4444" },
  light: { label: "Освещение", color: "#f59e0b" },
  trash: { label: "Мусор", color: "#22c55e" },
  traffic: { label: "Трафик", color: "#3b82f6" },
  other: { label: "Другое", color: "#94a3b8" },
};

const STAT_META = [
  { icon: <Activity size={20} />,    tone: "blue"   as const },
  { icon: <CircleCheck size={20} />, tone: "green"  as const },
  { icon: <ShieldAlert size={20} />, tone: "amber"  as const },
  { icon: <BarChart3 size={20} />,   tone: "purple" as const },
];

function NearbyIssueCard({
  issue,
  selected,
  onSelect,
}: {
  issue: CitizenOverviewIssue;
  selected: boolean;
  onSelect: () => void;
}) {
  const cat = CATEGORY_DISPLAY[issue.category] ?? { label: "Другое", color: "#94a3b8" };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "overflow-hidden rounded-[20px] border bg-white text-left transition-all",
        selected
          ? "border-teal-200 shadow-[0_20px_50px_-30px_rgba(15,118,110,0.5)]"
          : "border-slate-200/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.1)] hover:border-slate-300 hover:shadow-[0_14px_40px_-18px_rgba(15,23,42,0.18)]",
      ].join(" ")}
    >
      <div className="relative">
        {issue.imageUrl ? (
          <img src={issue.imageUrl} alt={issue.title} className="h-28 w-full object-cover" />
        ) : (
          <div className="flex h-28 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 text-xs font-medium text-slate-400">
            Нет фото
          </div>
        )}
        <div
          className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm"
          style={{ color: cat.color }}
        >
          <span
            className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          {cat.label}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold leading-snug text-slate-900">{issue.title}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{issue.address}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {issue.statusLabel}
          </span>
          <span className="ml-auto text-[10px] text-slate-400">{issue.distanceLabel}</span>
        </div>
      </div>
    </button>
  );
}

export default function CitizenHomePage() {
  const {
    loading,
    error,
    clusters,
    issues,
    selectedIssue,
    selectedIssueId,
    setSelectedIssueId,
    stats,
  } = useCitizenOverviewData();

  const [activeFilter, setActiveFilter] = useState("Все");

  const filteredIssues = useMemo(() => {
    const f = CATEGORY_FILTERS.find((f) => f.label === activeFilter);
    if (!f?.category) return issues;
    return issues.filter((issue) => issue.category === f.category);
  }, [activeFilter, issues]);

  const filteredClusters = useMemo(() => {
    const f = CATEGORY_FILTERS.find((f) => f.label === activeFilter);
    if (!f?.category) return clusters;
    return clusters.filter((c) => c.category === f.category);
  }, [activeFilter, clusters]);

  return (
    <CitizenShell
      title={
        <>
          Обращения по{" "}
          <span className="relative text-teal-700">
            Aktau
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-teal-200/80"
            />
          </span>
        </>
      }
      subtitle="Смотрите, что происходит рядом, и помогайте службам реагировать быстрее."
      topbarAction={
        <Link to="/citizen/report" className="citizen-v2-primary-link">
          + Новая заявка
        </Link>
      }
    >
      {/* ── Filter bar ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
          <MapPin size={14} className="text-slate-400" />
          Все районы
        </div>

        <label className="flex min-w-[180px] flex-1 cursor-text items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Search size={14} className="flex-shrink-0 text-slate-400" />
          <input
            placeholder="Поиск по адресу или проблеме"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setActiveFilter(f.label)}
              className={[
                "flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm font-medium transition",
                activeFilter === f.label
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {f.color ? (
                <span
                  className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
              ) : null}
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <SlidersHorizontal size={14} />
          Фильтры
        </button>
      </div>

      {/* ── Map + Detail panel ── */}
      <div className="citizen-v2-overview-grid mt-3">
        <article className="citizen-v2-panel !p-2">
          <div className="overflow-hidden rounded-2xl">
            <CityMap
              clusters={filteredClusters}
              selectedId={selectedIssueId}
              onSelect={setSelectedIssueId}
              height="320px"
              className="rounded-2xl"
            />
          </div>
        </article>

        <aside className="citizen-v2-side-stack">
          <CitizenIssueDetailRail
            issue={selectedIssue}
            primaryAction={
              selectedIssue ? (
                <Link
                  to={selectedIssue.detailsHref ?? "/citizen/map"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Подробнее
                  <ArrowRight size={15} />
                </Link>
              ) : null
            }
          />

          <article className="citizen-v2-panel flex items-start gap-3 !p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-teal-700">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">Прозрачно. Проверено. Понятно.</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Проверка со стороны жителей до передачи в работу.
              </p>
              <Link
                to="/citizen/verify"
                className="mt-2 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Проверить
              </Link>
            </div>
          </article>
        </aside>
      </div>

      {/* ── Stats row ── */}
      {loading ? (
        <div className="mt-3 flex items-center justify-center py-4 text-xs text-slate-500">
          <LoaderCircle className="mr-2 animate-spin" size={14} />
          Загрузка сводки
        </div>
      ) : error ? (
        <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      ) : (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => (
            <CitizenMetricCard
              key={stat.label}
              icon={STAT_META[i]?.icon}
              label={stat.label}
              value={stat.value}
              note={stat.note}
              tone={STAT_META[i]?.tone}
            />
          ))}
        </div>
      )}

      {/* ── Nearby Issues ── */}
      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="citizen-v2-eyebrow !mb-1">Рядом</p>
          </div>
          <Link to="/citizen/map" className="citizen-v2-inline-link shrink-0 text-xs">
            Открыть на карте
            <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-36 items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-500">
            <LoaderCircle className="mr-2 animate-spin" size={16} />
            Загрузка обращений
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">Пока рядом нет обращений</p>
            <p className="mt-1 text-sm text-slate-500">
              Новые сигналы появятся здесь после загрузки данных.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredIssues.map((issue) => (
              <NearbyIssueCard
                key={issue.id}
                issue={issue}
                selected={issue.id === selectedIssueId}
                onSelect={() => setSelectedIssueId(issue.id)}
              />
            ))}
          </div>
        )}
      </section>
    </CitizenShell>
  );
}
