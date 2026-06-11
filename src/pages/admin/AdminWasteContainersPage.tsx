import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Battery,
  Box,
  CheckCircle2,
  Flame,
  MapPin,
  Search,
  Thermometer,
  Trash2,
  Truck,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import { CityMap } from "@/components/maps/CityMap";
import { SmartWasteIcon } from "@/components/icons";
import type { ClusterRecord, SmartBinStatus, SmartBinWasteType } from "@/types";

/* ── Mock data generation ──────────────────────────────────── */

type BinRecord = {
  id: string;
  label: string;
  district: string;
  lat: number;
  lng: number;
  wasteType: SmartBinWasteType;
  fillLevel: number;
  temperature: number;
  status: SmartBinStatus;
  lastSeen: string;
  collectedToday: number;
  alerts: number;
  tags: string[];
};

const SEED_BINS: BinRecord[] = [
  {
    id: "bin-0001",
    label: "Контейнер #8052",
    district: "3 мкр",
    lat: 43.6485,
    lng: 51.1580,
    wasteType: "mixed",
    fillLevel: 27,
    temperature: 23,
    status: "normal",
    lastSeen: new Date().toISOString(),
    collectedToday: 4,
    alerts: 0,
    tags: ["residential"],
  },
  {
    id: "bin-0002",
    label: "Контейнер #8107",
    district: "5 мкр",
    lat: 43.6390,
    lng: 51.1430,
    wasteType: "plastic",
    fillLevel: 74,
    temperature: 26,
    status: "warning",
    lastSeen: new Date().toISOString(),
    collectedToday: 2,
    alerts: 1,
    tags: ["recycling", "park"],
  },
  {
    id: "bin-0003",
    label: "Контейнер #8230",
    district: "14 мкр",
    lat: 43.6550,
    lng: 51.1750,
    wasteType: "metal",
    fillLevel: 92,
    temperature: 31,
    status: "full",
    lastSeen: new Date().toISOString(),
    collectedToday: 0,
    alerts: 2,
    tags: ["commercial"],
  },
  {
    id: "bin-0004",
    label: "Контейнер #8341",
    district: "Центр",
    lat: 43.6420,
    lng: 51.1650,
    wasteType: "mixed",
    fillLevel: 44,
    temperature: 22,
    status: "normal",
    lastSeen: new Date().toISOString(),
    collectedToday: 3,
    alerts: 0,
    tags: ["residential", "school"],
  },
];

/* ── Status helpers ──────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  SmartBinStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  normal: {
    label: "Норма",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "#22c55e",
  },
  warning: {
    label: "Заполняется",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "#f59e0b",
  },
  full: {
    label: "Переполнен",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "#ef4444",
  },
  fire: {
    label: "Пожар",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "#dc2626",
  },
  sos: {
    label: "SOS",
    bg: "bg-rose-100",
    text: "text-rose-800",
    dot: "#e11d48",
  },
  offline: {
    label: "Оффлайн",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "#94a3b8",
  },
};

const WASTE_TYPE_META: Record<
  SmartBinWasteType,
  { label: string; color: string }
> = {
  plastic: { label: "Пластик", color: "#3b82f6" },
  metal: { label: "Металл", color: "#f59e0b" },
  mixed: { label: "Смешанные", color: "#22c55e" },
};

/* ── Component ──────────────────────────────────────────────── */

export default function AdminWasteContainersPage() {
  const [bins] = useState(SEED_BINS);
  const [selectedBin, setSelectedBin] = useState<BinRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  useEffect(() => {
    if (bins.length > 0 && !selectedBin) {
      setSelectedBin(bins[0]);
    }
  }, [bins, selectedBin]);

  // Convert bins to cluster-like records for the map
  const mapClusters: ClusterRecord[] = useMemo(
    () =>
      bins.map((bin) => ({
        id: bin.id,
        category: bin.wasteType === "plastic" ? "traffic" as const : bin.wasteType === "metal" ? "light" as const : "trash" as const,
        effectiveCategory: "trash" as const,
        lat: bin.lat,
        lng: bin.lng,
        address: bin.label,
        district: bin.district,
        zoneCoefficient: 1,
        reportCount: bin.fillLevel,
        severity: bin.fillLevel,
        priorityScore: bin.fillLevel,
        priorityReason: null,
        topFactors: [],
        prioritySourceReportId: null,
        status: bin.status === "normal" ? "open" as const : bin.status === "offline" ? "closed" as const : "in_progress" as const,
        representativePhotoUrl: null,
        aiValidationStatus: "valid" as const,
        effectiveVisualSeverity: null,
        moderatorReviewStatus: "pending" as const,
        createdAt: bin.lastSeen,
        updatedAt: bin.lastSeen,
      })),
    [bins],
  );

  // Stats
  const stats = useMemo(() => {
    const total = bins.length;
    const online = bins.filter((b) => b.status === "normal").length;
    const warnings = bins.filter((b) => b.status === "warning").length;
    const alerts = bins.filter(
      (b) => b.status === "full" || b.status === "fire" || b.status === "sos",
    ).length;
    const collections = bins.reduce((s, b) => s + b.collectedToday, 0);
    const avgFill = Math.round(
      bins.reduce((s, b) => s + b.fillLevel, 0) / total,
    );
    return { total, online, warnings, alerts, collections, avgFill };
  }, [bins]);

  // Charts data
  const wasteTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const bin of bins) {
      map[bin.wasteType] = (map[bin.wasteType] ?? 0) + 1;
    }
    return Object.entries(map).map(([key, value]) => ({
      name: WASTE_TYPE_META[key as SmartBinWasteType].label,
      value,
      color: WASTE_TYPE_META[key as SmartBinWasteType].color,
    }));
  }, [bins]);

  const topContainers = useMemo(
    () =>
      [...bins]
        .sort((a, b) => b.collectedToday - a.collectedToday)
        .slice(0, 6)
        .map((b) => ({
          name: b.label.replace("Контейнер #", "#"),
          collections: b.collectedToday,
        })),
    [bins],
  );

  // Filtered table
  const filteredBins = useMemo(() => {
    return bins.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (districtFilter !== "all" && b.district !== districtFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.label.toLowerCase().includes(q) ||
          b.district.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bins, statusFilter, districtFilter, search]);

  const selectedSc = selectedBin ? STATUS_CONFIG[selectedBin.status] : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Умные контейнеры
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Сеть контейнеров и текущее состояние по точкам.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            Все статусы
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs outline-none"
            >
              <option value="all">Все статусы</option>
              <option value="normal">Норма</option>
              <option value="warning">Заполняется</option>
              <option value="full">Переполнен</option>
              <option value="offline">Оффлайн</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-transparent text-xs outline-none"
            >
              <option value="all">Все районы</option>
              {[...new Set(SEED_BINS.map((b) => b.district))].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Map + Container detail */}
      <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
        <div className="citizen-v2-panel !p-2">
          <div className="overflow-hidden rounded-2xl">
            <CityMap
              clusters={mapClusters}
              selectedId={selectedBin?.id}
              onSelect={(id) => {
                const found = bins.find((b) => b.id === id);
                if (found) setSelectedBin(found);
              }}
              height="320px"
              className="rounded-2xl"
            />
          </div>
        </div>

        {/* Container detail */}
        {selectedBin && selectedSc ? (
          <div className="citizen-v2-panel">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900">
                {selectedBin.label}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${selectedSc.bg} ${selectedSc.text}`}
              >
                {selectedSc.label}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin size={10} />
              {selectedBin.district}
            </div>

            {/* Container image placeholder */}
            <div className="mt-3 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50">
              <SmartWasteIcon size={52} />
            </div>

            {/* Fill level gauge */}
            <div className="mt-3 flex items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full -rotate-90"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={
                      selectedBin.fillLevel > 80
                        ? "#ef4444"
                        : selectedBin.fillLevel > 50
                          ? "#f59e0b"
                          : "#22c55e"
                    }
                    strokeWidth="10"
                    strokeDasharray={`${selectedBin.fillLevel * 2.64} ${264 - selectedBin.fillLevel * 2.64}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">
                    {selectedBin.fillLevel}%
                  </span>
                  <span className="text-[9px] text-slate-400">Заполненность</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-center">
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="text-xs font-bold text-slate-900">
                  {selectedBin.temperature}°C
                </p>
                <p className="text-[9px] text-slate-400">Темп.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="text-xs font-bold text-slate-900">
                  {selectedBin.collectedToday}
                </p>
                <p className="text-[9px] text-slate-400">Собрано</p>
              </div>
            </div>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white"
            >
              <Truck size={14} />
              Назначить вывоз
            </button>
          </div>
        ) : (
          <div className="citizen-v2-panel flex items-center justify-center text-xs text-slate-400" style={{ minHeight: 200 }}>
            Выберите контейнер на карте
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <MiniStat
          icon={<Box size={16} />}
          value={stats.total}
          label="Всего контейнеров"
          tone="blue"
        />
        <MiniStat
          icon={<Wifi size={16} />}
          value={stats.online}
          label="Норма"
          tone="green"
        />
        <MiniStat
          icon={<Battery size={16} />}
          value={`${stats.avgFill}%`}
          label="Средняя заполненность"
          tone="teal"
        />
        <MiniStat
          icon={<AlertTriangle size={16} />}
          value={stats.alerts}
          label="Тревоги"
          tone="red"
        />
        <MiniStat
          icon={<Truck size={16} />}
          value={stats.collections}
          label="Вывозов сегодня"
          tone="amber"
        />
        <MiniStat
          icon={<CheckCircle2 size={16} />}
          value={stats.warnings}
          label="Предупреждения"
          tone="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-3 xl:grid-cols-3">
        {/* Fill level heatmap (mini map) */}
        <div className="citizen-v2-panel">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Покрытие по карте
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Контейнеры по районам
          </p>
          <div className="mt-3 overflow-hidden rounded-xl">
            <CityMap
              clusters={mapClusters.slice(0, 20)}
              height="160px"
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Waste types donut */}
        <div className="citizen-v2-panel">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Типы отходов
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Распределение по типам
          </p>
          <div className="mt-2 flex items-center gap-4">
            <div style={{ width: 130, height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wasteTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {wasteTypeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {wasteTypeData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-slate-700">{entry.name}</span>
                  <span className="text-xs font-bold text-slate-900">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most visited containers */}
        <div className="citizen-v2-panel">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Активные контейнеры
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            По вывозу за сегодня
          </p>
          <div className="mt-2" style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topContainers} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar
                  dataKey="collections"
                  fill="#0f766e"
                  radius={[0, 6, 6, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Container table */}
      <div className="citizen-v2-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Список контейнеров
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Показано {filteredBins.length} из {bins.length}
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <Search size={12} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск контейнеров..."
              className="w-32 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-2 pr-3">Контейнер</th>
                <th className="pb-2 pr-3">Локация</th>
                <th className="pb-2 pr-3">Статус</th>
                <th className="pb-2 pr-3">Заполненность</th>
                <th className="pb-2 pr-3">Собрано сегодня</th>
                <th className="pb-2 pr-3">Температура</th>
                <th className="pb-2 pr-3">Тревоги</th>
                <th className="pb-2">Теги</th>
              </tr>
            </thead>
            <tbody>
              {filteredBins.slice(0, 12).map((bin) => {
                const sc = STATUS_CONFIG[bin.status];
                return (
                  <tr
                    key={bin.id}
                    onClick={() => setSelectedBin(bin)}
                    className={[
                      "cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/60",
                      selectedBin?.id === bin.id ? "bg-teal-50/40" : "",
                    ].join(" ")}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                          <Trash2
                            size={14}
                            className="text-slate-500"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {bin.label}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {WASTE_TYPE_META[bin.wasteType].label}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      {bin.district}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.bg} ${sc.text}`}
                      >
                        {bin.status === "offline" ? (
                          <WifiOff size={9} />
                        ) : bin.status === "fire" ? (
                          <Flame size={9} />
                        ) : null}
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${bin.fillLevel}%`,
                              backgroundColor:
                                bin.fillLevel > 80
                                  ? "#ef4444"
                                  : bin.fillLevel > 50
                                    ? "#f59e0b"
                                    : "#22c55e",
                            }}
                          />
                        </div>
                        <span className="font-medium text-slate-700">
                          {bin.fillLevel}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-slate-700">
                      {bin.collectedToday}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Thermometer size={10} className="text-slate-400" />
                        {bin.temperature}°C
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      {bin.alerts > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          <AlertTriangle size={9} />
                          {bin.alerts}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {bin.tags.length > 0
                          ? bin.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500"
                              >
                                {tag}
                              </span>
                            ))
                          : <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */

const TONE_MAP = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700" },
  teal: { bg: "bg-teal-50", text: "text-teal-700" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-700" },
} as const;

function MiniStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  tone: keyof typeof TONE_MAP;
}) {
  const t = TONE_MAP[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.text}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base font-black leading-none text-slate-950">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}
