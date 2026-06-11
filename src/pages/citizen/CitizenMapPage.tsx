import { Activity, BarChart3, CircleCheck, Search, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { CitizenEmptyState } from "@/components/citizen-v2/CitizenEmptyState";
import { CitizenFilterChipGroup } from "@/components/citizen-v2/CitizenFilterChipGroup";
import { CitizenIssueDetailRail } from "@/components/citizen-v2/CitizenIssueDetailRail";
import { CitizenMetricCard } from "@/components/citizen-v2/CitizenMetricCard";
import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import { citizenCopy } from "@/components/citizen-v2/citizen-copy";
import { CityMap } from "@/components/maps/CityMap";
import { useCitizenOverviewData } from "@/hooks/useCitizenOverviewData";

const FILTERS = ["Все", "Дороги", "Освещение", "Мусор", "Трафик", "Другое"] as const;

export default function CitizenMapPage() {
  const { loading, error, clusters, issues, selectedIssueId, selectedIssue, setSelectedIssueId, stats } =
    useCitizenOverviewData();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("Все");
  const [search, setSearch] = useState("");

  const filteredIssues = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return issues.filter((issue) => {
      const filterMatch =
        activeFilter === "Все" ||
        (activeFilter === "Дороги" && issue.category === "road") ||
        (activeFilter === "Освещение" && issue.category === "light") ||
        (activeFilter === "Мусор" && issue.category === "trash") ||
        (activeFilter === "Трафик" && issue.category === "traffic") ||
        (activeFilter === "Другое" && issue.category === "other");
      const searchMatch =
        !normalized ||
        issue.title.toLowerCase().includes(normalized) ||
        issue.address.toLowerCase().includes(normalized);
      return filterMatch && searchMatch;
    });
  }, [activeFilter, issues, search]);

  const filteredClusterIds = new Set(filteredIssues.map((issue) => issue.id));
  const filteredClusters = clusters.filter((cluster) => filteredClusterIds.has(cluster.id));

  return (
    <CitizenShell
      title={citizenCopy.overviewTitle}
      subtitle="Смотрите сигналы по городу и быстро переходите к нужной точке."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="citizen-v2-panel">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
                Все районы
              </div>
              <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по месту или проблеме"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>
              <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                <SlidersHorizontal size={16} />
                Фильтры
              </button>
            </div>
            <div className="mt-4">
              <CitizenFilterChipGroup value={activeFilter} options={FILTERS} onChange={setActiveFilter} />
            </div>
            <div className="mt-5 overflow-hidden rounded-[24px]">
              <CityMap
                clusters={filteredClusters}
                selectedId={selectedIssueId}
                onSelect={setSelectedIssueId}
                height="460px"
                className="rounded-[24px]"
                navigationPosition="top-right"
              />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <CitizenMetricCard icon={<Activity size={22} />} label={stats[0]?.label ?? "Активно рядом"} value={stats[0]?.value ?? "0"} note={stats[0]?.note ?? ""} />
            <CitizenMetricCard icon={<CircleCheck size={22} />} label={stats[1]?.label ?? "Решено за неделю"} value={stats[1]?.value ?? "0"} note={stats[1]?.note ?? ""} />
            <CitizenMetricCard icon={<ShieldAlert size={22} />} label={stats[2]?.label ?? "Нужна проверка"} value={stats[2]?.value ?? "0"} note={stats[2]?.note ?? ""} />
            <CitizenMetricCard icon={<BarChart3 size={22} />} label={stats[3]?.label ?? "Всего заявок"} value={stats[3]?.value ?? "0"} note={stats[3]?.note ?? ""} />
          </section>

          <section className="citizen-v2-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="citizen-v2-eyebrow">Рядом</p>
                <h2>Список точек</h2>
              </div>
              <p className="text-sm text-slate-400">{filteredIssues.length} видно</p>
            </div>

            {loading ? (
              <div className="mt-5 text-sm text-slate-500">Загрузка точек...</div>
            ) : error ? (
              <div className="mt-5 text-sm text-rose-700">{error}</div>
            ) : filteredIssues.length === 0 ? (
              <div className="mt-5">
                <CitizenEmptyState title="Ничего не найдено" body="Измените фильтры или дождитесь новых заявок." />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filteredIssues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="grid w-full gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300 md:grid-cols-[110px_minmax(0,1.8fr)_120px_120px]"
                  >
                    {issue.imageUrl ? (
                      <img src={issue.imageUrl} alt={issue.title} className="h-20 w-full rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-20 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">Нет фото</div>
                    )}
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{issue.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{issue.address}</p>
                    </div>
                    <div className="text-sm text-slate-500">{issue.distanceLabel}</div>
                    <div className="text-sm text-slate-500">{issue.priorityLabel}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <CitizenIssueDetailRail issue={selectedIssue} />
        </div>
      </div>
    </CitizenShell>
  );
}
