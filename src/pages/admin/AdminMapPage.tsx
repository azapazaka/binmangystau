import { format } from "date-fns";
import {
  ArrowRight,
  Gauge,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { CityMap } from "@/components/maps/CityMap";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { listClusters, listReports, updateClusterStatus } from "@/lib/api";
import { STATUS_META } from "@/lib/constants";
import type { ClusterRecord, ReportCategory, ReportRecord } from "@/types";

const CATEGORIES = [
  { key: "all", label: "Все" },
  { key: "road", label: "Дороги" },
  { key: "light", label: "Освещение" },
  { key: "trash", label: "Мусор" },
  { key: "traffic", label: "Трафик" },
  { key: "other", label: "Другое" },
];

export default function AdminMapPage() {
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<ClusterRecord | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listClusters({
      category: cat !== "all" ? (cat as ReportCategory) : undefined,
    })
      .then((nextClusters) => {
        setClusters(nextClusters);
        setSelected((current) =>
          current ? nextClusters.find((cluster) => cluster.id === current.id) ?? nextClusters[0] ?? null : nextClusters[0] ?? null,
        );
      })
      .catch(console.error);
  }, [cat]);

  useEffect(() => {
    listReports().then(setReports).catch(console.error);
  }, []);

  const stats = useMemo(() => {
    const active = clusters.filter((cluster) => cluster.status !== "closed").length;
    const highPriority = clusters.filter((cluster) => cluster.priorityScore >= 65).length;
    return {
      reports: reports.length,
      clusters: clusters.length,
      active,
      highPriority,
    };
  }, [clusters, reports]);

  const handleStatusChange = async (status: ClusterRecord["status"]) => {
    if (!selected) return;
    try {
      await updateClusterStatus(selected.id, status);
      setClusters((cs) =>
        cs.map((cluster) => (cluster.id === selected.id ? { ...cluster, status } : cluster)),
      );
      setSelected((current) => (current ? { ...current, status } : null));
    } catch (error) {
      console.error("Не удалось обновить статус:", error);
    }
  };

  const filteredReports = reports
    .filter((report) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        report.address?.toLowerCase().includes(q) ||
        report.district?.toLowerCase().includes(q) ||
        report.description.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <header>
        <p className="citizen-v2-eyebrow">Карта и обращения</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Карта и обращения
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Сводка по карте, свежие обращения и быстрый просмотр выбранного кластера.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Обращения", value: stats.reports, note: "в системе", icon: Gauge },
          { label: "Кластеры", value: stats.clusters, note: "на карте", icon: MapPin },
          { label: "Активные", value: stats.active, note: "не закрыты", icon: Gauge },
          { label: "Приоритет", value: stats.highPriority, note: "65+", icon: Gauge },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="citizen-v2-panel flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {item.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
              </div>
            </article>
          );
        })}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по адресу"
            className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={[
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                cat === c.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal size={12} />
          Фильтры
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="citizen-v2-panel !p-2">
            <div className="overflow-hidden rounded-2xl">
              <CityMap
                clusters={clusters}
                selectedId={selected?.id}
                onSelect={(id) => setSelected(clusters.find((cluster) => cluster.id === id) ?? null)}
                height="420px"
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="citizen-v2-panel">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Последние обращения
              </p>
              <Link
                to="/admin/map"
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-700"
              >
                Все <ArrowRight size={11} />
              </Link>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-2 pr-3">Фото</th>
                    <th className="pb-2 pr-3">Описание</th>
                    <th className="pb-2 pr-3">Локация</th>
                    <th className="pb-2 pr-3">Дата</th>
                    <th className="pb-2 pr-3">Категория</th>
                    <th className="pb-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Заявки не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const sm = STATUS_META[report.status];
                      return (
                        <tr
                          key={report.id}
                          className="border-b border-slate-50 transition hover:bg-slate-50/60"
                        >
                          <td className="py-2 pr-3">
                            {report.photoUrl ? (
                              <img
                                src={report.photoUrl}
                                alt=""
                                className="h-9 w-9 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[8px] text-slate-400">
                                —
                              </div>
                            )}
                          </td>
                          <td className="max-w-[180px] truncate py-2 pr-3 font-medium text-slate-900">
                            {report.description || "Без описания"}
                          </td>
                          <td className="py-2 pr-3 text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin size={10} className="text-slate-400" />
                              <span className="max-w-[120px] truncate">
                                {report.address ?? report.district ?? "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-slate-500">
                            {format(new Date(report.createdAt), "dd.MM.yy")}
                          </td>
                          <td className="py-2 pr-3">
                            <CategoryBadge category={report.userCategory} />
                          </td>
                          <td className="py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sm.bgClass} ${sm.textClass}`}
                            >
                              {sm.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selected ? (
          <div className="space-y-4">
            <div className="citizen-v2-panel">
              <div className="flex items-center justify-between">
                <CategoryBadge category={selected.category} />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              </div>

              {selected.representativePhotoUrl ? (
                <img
                  src={selected.representativePhotoUrl}
                  alt=""
                  className="mt-3 h-32 w-full rounded-2xl object-cover"
                />
              ) : null}

              <p className="mt-3 text-sm font-bold text-slate-900">
                {selected.address ?? `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
              </p>
              {selected.district ? (
                <p className="mt-0.5 text-xs text-slate-500">{selected.district}</p>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold text-slate-900">{selected.reportCount}</p>
                  <p className="text-[9px] text-slate-400">Заявки</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold text-slate-900">
                    {Math.round(selected.priorityScore)}
                  </p>
                  <p className="text-[9px] text-slate-400">Приоритет</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-semibold text-slate-500">Статус</p>
                <div className="mt-1.5 flex gap-1.5">
                  {(["open", "in_progress", "closed"] as const).map((status) => {
                    const sm = STATUS_META[status];
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(status)}
                        className={[
                          "flex-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition",
                          selected.status === status
                            ? `${sm.bgClass} ${sm.textClass} border-current`
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        {sm.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="citizen-v2-panel flex items-center justify-center text-xs text-slate-400"
            style={{ minHeight: 200 }}
          >
            Выберите кластер на карте
          </div>
        )}
      </div>
    </div>
  );
}
