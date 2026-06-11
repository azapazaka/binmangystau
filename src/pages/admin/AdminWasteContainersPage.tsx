import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Battery, Box, MapPin, Thermometer, Truck } from "lucide-react";

import { CityMap } from "@/components/maps/CityMap";
import { SmartWasteIcon } from "@/components/icons";
import type { ClusterRecord, SmartBinStatus, SmartBinWasteType } from "@/types";

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
};

const SEED_BINS: BinRecord[] = [
  {
    id: "bin-0001",
    label: "Контейнер #8052",
    district: "3 мкр",
    lat: 43.6485,
    lng: 51.158,
    wasteType: "mixed",
    fillLevel: 27,
    temperature: 23,
    status: "normal",
    lastSeen: new Date().toISOString(),
    collectedToday: 4,
    alerts: 0,
  },
  {
    id: "bin-0002",
    label: "Контейнер #8107",
    district: "5 мкр",
    lat: 43.639,
    lng: 51.143,
    wasteType: "plastic",
    fillLevel: 74,
    temperature: 26,
    status: "warning",
    lastSeen: new Date().toISOString(),
    collectedToday: 2,
    alerts: 1,
  },
  {
    id: "bin-0003",
    label: "Контейнер #8230",
    district: "14 мкр",
    lat: 43.655,
    lng: 51.175,
    wasteType: "metal",
    fillLevel: 92,
    temperature: 31,
    status: "full",
    lastSeen: new Date().toISOString(),
    collectedToday: 0,
    alerts: 2,
  },
  {
    id: "bin-0004",
    label: "Контейнер #8341",
    district: "Центр",
    lat: 43.642,
    lng: 51.165,
    wasteType: "mixed",
    fillLevel: 44,
    temperature: 22,
    status: "normal",
    lastSeen: new Date().toISOString(),
    collectedToday: 3,
    alerts: 0,
  },
];

const STATUS_CONFIG: Record<SmartBinStatus, { label: string; bg: string; text: string }> = {
  normal: { label: "Норма", bg: "bg-emerald-50", text: "text-emerald-700" },
  warning: { label: "Заполняется", bg: "bg-amber-50", text: "text-amber-700" },
  full: { label: "Переполнен", bg: "bg-red-50", text: "text-red-700" },
  fire: { label: "Пожар", bg: "bg-red-100", text: "text-red-800" },
  sos: { label: "SOS", bg: "bg-rose-100", text: "text-rose-800" },
  offline: { label: "Оффлайн", bg: "bg-slate-100", text: "text-slate-600" },
};

export default function AdminWasteContainersPage() {
  const [bins] = useState(SEED_BINS);
  const [selectedBin, setSelectedBin] = useState<BinRecord | null>(null);

  useEffect(() => {
    if (bins.length > 0 && !selectedBin) setSelectedBin(bins[0]);
  }, [bins, selectedBin]);

  const mapClusters: ClusterRecord[] = useMemo(
    () =>
      bins.map((bin) => ({
        id: bin.id,
        category: "trash" as const,
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

  const stats = useMemo(() => {
    const total = bins.length;
    const avgFill = Math.round(bins.reduce((sum, bin) => sum + bin.fillLevel, 0) / total);
    const alerts = bins.filter((bin) => bin.alerts > 0).length;
    const urgent = bins.filter((bin) => bin.fillLevel >= 80).length;
    const collected = bins.reduce((sum, bin) => sum + bin.collectedToday, 0);
    return { total, avgFill, alerts, urgent, collected };
  }, [bins]);

  const selectedSc = selectedBin ? STATUS_CONFIG[selectedBin.status] : null;

  return (
    <div className="space-y-4">
      <header>
        <p className="citizen-v2-eyebrow">Контейнеры</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Контейнеры
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Только карта, заполненность и несколько быстрых показателей по сети.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Всего", value: stats.total, icon: Box },
          { label: "Средняя заполненность", value: `${stats.avgFill}%`, icon: Battery },
          { label: "Срочные", value: stats.urgent, icon: AlertTriangle },
          { label: "С тревогами", value: stats.alerts, icon: Thermometer },
          { label: "Сегодня вывезли", value: stats.collected, icon: Truck },
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
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="citizen-v2-panel !p-2">
          <div className="overflow-hidden rounded-2xl">
            <CityMap
              clusters={mapClusters}
              selectedId={selectedBin?.id}
              onSelect={(id) => {
                const found = bins.find((bin) => bin.id === id);
                if (found) setSelectedBin(found);
              }}
              height="420px"
              className="rounded-2xl"
            />
          </div>
        </div>

        {selectedBin && selectedSc ? (
          <div className="citizen-v2-panel">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900">{selectedBin.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${selectedSc.bg} ${selectedSc.text}`}>
                {selectedSc.label}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin size={10} />
              {selectedBin.district}
            </div>

            <div className="mt-3 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50">
              <SmartWasteIcon size={52} />
            </div>

            <div className="mt-3 flex items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={selectedBin.fillLevel > 80 ? "#ef4444" : selectedBin.fillLevel > 50 ? "#f59e0b" : "#22c55e"}
                    strokeWidth="10"
                    strokeDasharray={`${selectedBin.fillLevel * 2.64} ${264 - selectedBin.fillLevel * 2.64}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{selectedBin.fillLevel}%</span>
                  <span className="text-[9px] text-slate-400">Заполненность</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="text-xs font-bold text-slate-900">{selectedBin.temperature}°C</p>
                <p className="text-[9px] text-slate-400">Температура</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="text-xs font-bold text-slate-900">{selectedBin.collectedToday}</p>
                <p className="text-[9px] text-slate-400">Сегодня вывезли</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="citizen-v2-panel flex items-center justify-center text-xs text-slate-400" style={{ minHeight: 200 }}>
            Выберите контейнер на карте
          </div>
        )}
      </div>

      <div className="citizen-v2-panel">
        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
          Краткий список
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-2 pr-3">Контейнер</th>
                <th className="pb-2 pr-3">Район</th>
                <th className="pb-2 pr-3">Заполненность</th>
                <th className="pb-2 pr-3">Статус</th>
                <th className="pb-2">Теги</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((bin) => {
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
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{bin.label}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{bin.district}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${bin.fillLevel}%`,
                              backgroundColor:
                                bin.fillLevel > 80 ? "#ef4444" : bin.fillLevel > 50 ? "#f59e0b" : "#22c55e",
                            }}
                          />
                        </div>
                        <span className="font-medium text-slate-700">{bin.fillLevel}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">—</td>
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
