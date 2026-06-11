import {
  Activity,
  ArrowRight,
  BarChart3,
  CircleCheck,
  ClipboardList,
  LoaderCircle,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Link } from "react-router";

import { CityMap } from "@/components/maps/CityMap";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getDashboardStats, listClusters, listReports } from "@/lib/api";
import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import type {
  ClusterRecord,
  DashboardStats,
  ReportCategory,
  ReportRecord,
} from "@/types";

/* ── Category color map ─────────────────────────────────────── */

const CAT_ITEMS: { key: ReportCategory; label: string; color: string }[] = [
  { key: "road", label: "Дороги", color: CATEGORY_META.road.color },
  { key: "trash", label: "Мусор", color: CATEGORY_META.trash.color },
  { key: "light", label: "Освещение", color: CATEGORY_META.light.color },
  { key: "traffic", label: "Трафик", color: CATEGORY_META.traffic.color },
  { key: "other", label: "Другое", color: CATEGORY_META.other.color },
];

/* ── Mock timeline data (would come from analytics API) ───── */

function buildTimelineData() {
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return days.map((d) => ({
    day: d,
    road:    Math.floor(Math.random() * 20 + 5),
    trash:   Math.floor(Math.random() * 15 + 3),
    light:   Math.floor(Math.random() * 12 + 2),
    traffic: Math.floor(Math.random() * 10 + 1),
  }));
}

/* ── Component ─────────────────────────────────────────────── */

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      listClusters({ category: "all" }),
      listReports(),
    ])
      .then(([s, c, r]) => {
        setStats(s);
        setClusters(c);
        setReports(r.slice(0, 8));
        if (c.length > 0) setSelectedId(c[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of clusters) {
      map[c.category] = (map[c.category] ?? 0) + c.reportCount;
    }
    return map;
  }, [clusters]);

  const timeline = useMemo(() => buildTimelineData(), []);

  const selectedCluster = clusters.find((c) => c.id === selectedId) ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const firstName = user?.fullName?.split(" ")[0] ?? "Админ";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" size={18} />
        Загрузка панели...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <header>
        <h1 className="text-lg font-bold text-slate-900">
          {greeting}, {firstName} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Краткая сводка по Актау.
        </p>
      </header>

      {/* ── Top grid: Map + Right panels ── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        {/* Map */}
        <div className="citizen-v2-panel !p-2">
          <div className="overflow-hidden rounded-2xl">
            <CityMap
              clusters={clusters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              height="300px"
              className="rounded-2xl"
            />
          </div>
        </div>

        {/* Right stack: pin stats + response timeline */}
        <div className="space-y-3">
          {/* Pin Statistics */}
          <div className="citizen-v2-panel">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Статистика по категориям
            </p>
            <div className="mt-3 space-y-2">
              {CAT_ITEMS.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-slate-700">{cat.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {catCounts[cat.key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Response timeline */}
          <div className="citizen-v2-panel">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Динамика
            </p>
            <div className="mt-2" style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
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
                  <Line type="monotone" dataKey="road" stroke={CATEGORY_META.road.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="trash" stroke={CATEGORY_META.trash.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="light" stroke={CATEGORY_META.light.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="traffic" stroke={CATEGORY_META.traffic.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatMini
          icon={<ClipboardList size={18} />}
          value={stats?.totalReports ?? 0}
          label="Всего заявок"
          note="за всё время"
          tone="blue"
        />
        <StatMini
          icon={<Activity size={18} />}
          value={stats?.inProgress ?? 0}
          label="В работе"
          note="активные точки"
          tone="amber"
        />
        <StatMini
          icon={<CircleCheck size={18} />}
          value={stats?.resolved ?? 0}
          label="Закрыто"
          note="завершено"
          tone="green"
        />
        <StatMini
          icon={<ShieldAlert size={18} />}
          value={`${stats?.aiAgreementRate ?? 0}%`}
          label="Точность AI"
          note="автопроверка"
          tone="purple"
        />
      </div>

      {/* ── Recent Reports + Selected detail ── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        {/* Recent reports */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Последние заявки
            </p>
            <Link
              to="/admin/map"
              className="flex items-center gap-1 text-[11px] font-semibold text-teal-700"
            >
              Все <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {reports.slice(0, 4).map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>

        {/* Selected cluster detail */}
        <div className="citizen-v2-panel">
          {selectedCluster ? (
            <>
              {selectedCluster.representativePhotoUrl ? (
                <img
                  src={selectedCluster.representativePhotoUrl}
                  alt=""
                  className="h-28 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-50 text-xs text-slate-400">
                  Нет фото
                </div>
              )}
              <div className="mt-3 flex items-center gap-1.5">
                <CategoryBadge category={selectedCluster.category} />
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_META[selectedCluster.status].bgClass} ${STATUS_META[selectedCluster.status].textClass}`}
                >
                  {STATUS_META[selectedCluster.status].label}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-900">
                {selectedCluster.address ??
                  `${selectedCluster.lat.toFixed(4)}, ${selectedCluster.lng.toFixed(4)}`}
              </p>
              {selectedCluster.district && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {selectedCluster.district}
                </p>
              )}
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {selectedCluster.reportCount}
                  </p>
                  <p className="text-[9px] text-slate-400">Заявки</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {Math.round(selectedCluster.priorityScore)}
                  </p>
                  <p className="text-[9px] text-slate-400">Балл</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {selectedCluster.priorityScore > 66
                      ? "Высокий"
                      : selectedCluster.priorityScore > 33
                        ? "Средний"
                        : "Низкий"}
                  </p>
                  <p className="text-[9px] text-slate-400">Приоритет</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-slate-400">
              Выберите точку на карте
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom action cards ── */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          icon={<MapPin size={16} />}
          label="Новая заявка"
          sub="Создать от имени жителя"
        />
        <ActionCard
          icon={<Users size={16} />}
          label="Очередь"
          sub="Нужна проверка"
        />
        <ActionCard
          icon={<BarChart3 size={16} />}
          label="Маршрут"
          sub="Передать в службу"
        />
        <ActionCard
          icon={<ShieldAlert size={16} />}
          label="Тревога"
          sub="Безопасность"
        />
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

const TONE_MAP = {
  blue:   { bg: "bg-blue-50",    text: "text-blue-600"    },
  green:  { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber:  { bg: "bg-amber-50",   text: "text-amber-700"   },
  purple: { bg: "bg-purple-50",  text: "text-purple-700"  },
} as const;

function StatMini({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  note?: string;
  tone: keyof typeof TONE_MAP;
}) {
  const t = TONE_MAP[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.text}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black leading-none text-slate-950">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: ReportRecord }) {
  const sm = STATUS_META[report.status];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {report.photoUrl ? (
        <img
          src={report.photoUrl}
          alt=""
          className="h-24 w-full object-cover"
        />
      ) : (
        <div className="flex h-24 items-center justify-center bg-slate-50 text-[10px] text-slate-400">
          Нет фото
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-xs font-bold text-slate-900">
          {report.description || report.address || "Без описания"}
        </p>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
          <MapPin size={10} />
          <span className="truncate">{report.district ?? "—"}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <CategoryBadge category={report.userCategory} />
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sm.bgClass} ${sm.textClass}`}
          >
            {sm.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900">{label}</p>
        <p className="truncate text-[10px] text-slate-500">{sub}</p>
      </div>
    </button>
  );
}
