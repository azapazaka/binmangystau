import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { CityMap } from "@/components/maps/CityMap";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { listClusters, listReports, updateClusterStatus } from "@/lib/api";
import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import type { ClusterRecord, ReportCategory, ReportRecord } from "@/types";

const CATEGORIES = [
  { key: "all",     label: "All"     },
  { key: "road",    label: "Roads"   },
  { key: "light",   label: "Lights"  },
  { key: "trash",   label: "Trash"   },
  { key: "traffic", label: "Traffic" },
  { key: "other",   label: "Other"   },
];

function buildTrendData() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((day) => ({
    day,
    reports: Math.floor(Math.random() * 18 + 4),
  }));
}

export default function AdminMapPage() {
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<ClusterRecord | null>(null);
  const [search, setSearch] = useState("");
  const [trendData] = useState(buildTrendData);

  useEffect(() => {
    listClusters({
      category: cat !== "all" ? (cat as ReportCategory) : undefined,
    })
      .then(setClusters)
      .catch(console.error);
  }, [cat]);

  useEffect(() => {
    listReports().then(setReports).catch(console.error);
  }, []);

  const handleStatusChange = async (status: ClusterRecord["status"]) => {
    if (!selected) return;
    try {
      await updateClusterStatus(selected.id, status);
      setClusters((cs) =>
        cs.map((c) => (c.id === selected.id ? { ...c, status } : c)),
      );
      setSelected((s) => (s ? { ...s, status } : null));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const nearbyReports = reports
    .filter((r) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (r.address?.toLowerCase().includes(q)) ||
          (r.district?.toLowerCase().includes(q)) ||
          r.description.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .slice(0, 8);

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-lg font-bold text-slate-900">Explore Issues</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Explore and manage all clusters across the city.
        </p>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[160px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location"
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
          Filters
        </button>
        <span className="ml-auto text-[11px] text-slate-400">
          {clusters.length} clusters
        </span>
      </div>

      {/* Map + detail */}
      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <div className="citizen-v2-panel !p-2">
            <div className="overflow-hidden rounded-2xl">
              <CityMap
                clusters={clusters}
                selectedId={selected?.id}
                onSelect={(id) =>
                  setSelected(clusters.find((c) => c.id === id) ?? null)
                }
                height="400px"
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Nearby Issues Table */}
          <div className="citizen-v2-panel">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Nearby Issues
              </p>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-700"
              >
                View all reports <ArrowRight size={11} />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-2 pr-3">Photo</th>
                    <th className="pb-2 pr-3">Description</th>
                    <th className="pb-2 pr-3">Location</th>
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 pr-3">Category</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nearbyReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    nearbyReports.map((r) => {
                      const sm = STATUS_META[r.status];
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-slate-50 transition hover:bg-slate-50/60"
                        >
                          <td className="py-2 pr-3">
                            {r.photoUrl ? (
                              <img
                                src={r.photoUrl}
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
                            {r.description || "No description"}
                          </td>
                          <td className="py-2 pr-3 text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin size={10} className="text-slate-400" />
                              <span className="max-w-[120px] truncate">
                                {r.address ?? r.district ?? "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-slate-500">
                            {format(new Date(r.createdAt), "dd.MM.yy")}
                          </td>
                          <td className="py-2 pr-3">
                            <CategoryBadge category={r.userCategory} />
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

        {/* Right detail panel */}
        {selected ? (
          <div className="space-y-3">
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

              {selected.representativePhotoUrl && (
                <img
                  src={selected.representativePhotoUrl}
                  alt=""
                  className="mt-3 h-32 w-full rounded-2xl object-cover"
                />
              )}

              <p className="mt-3 text-sm font-bold text-slate-900">
                {selected.address ??
                  `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
              </p>
              {selected.district && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {selected.district}
                </p>
              )}

              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold text-slate-900">
                    {selected.reportCount}
                  </p>
                  <p className="text-[9px] text-slate-400">Reports</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold text-slate-900">
                    {Math.round(selected.priorityScore)}
                  </p>
                  <p className="text-[9px] text-slate-400">Score</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold text-slate-900">
                    {selected.priorityScore > 66
                      ? "High"
                      : selected.priorityScore > 33
                        ? "Med"
                        : "Low"}
                  </p>
                  <p className="text-[9px] text-slate-400">Priority</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-semibold text-slate-500">Status</p>
                <div className="mt-1.5 flex gap-1.5">
                  {(["open", "in_progress", "closed"] as const).map((s) => {
                    const sm = STATUS_META[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(s)}
                        className={[
                          "flex-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition",
                          selected.status === s
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

              <p className="mt-3 text-[10px] text-slate-400">
                Created:{" "}
                {format(new Date(selected.createdAt), "dd.MM.yyyy")}
              </p>
            </div>

            {/* Trend chart */}
            <div className="citizen-v2-panel">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Report Trend
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Reports in this cluster over the past week
              </p>
              <div className="mt-3" style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="reports"
                      stroke={
                        selected
                          ? CATEGORY_META[selected.category]?.color ?? "#0f766e"
                          : "#0f766e"
                      }
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="citizen-v2-panel flex items-center justify-center text-xs text-slate-400"
            style={{ minHeight: 200 }}
          >
            Select a cluster on the map
          </div>
        )}
      </div>
    </div>
  );
}
