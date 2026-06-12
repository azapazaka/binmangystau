import { format } from "date-fns";
import type { ReactNode } from "react";
import { MapPin, RefreshCw, TriangleAlert, Wifi, WifiOff } from "lucide-react";

import { SmartWasteIcon } from "@/components/icons";
import { CityMap } from "@/components/maps/CityMap";
import { useLiveSmartBin } from "@/hooks/useLiveSmartBin";
import {
  getSmartBinMaxFillLevel,
  getSmartBinOverallStatus,
  SMART_BIN_LABELS,
  SMART_BIN_SECTION_KEYS,
} from "@/lib/smartBin";
import { resolveSmartBinRuntimeSource } from "@/lib/smartBinSource";
import AdminWasteContainersLegacyPage from "@/pages/admin/AdminWasteContainersLegacyPage";
import type {
  SmartBinRuntimeSource,
  SmartBinSectionKey,
  SmartBinStatus,
} from "@/types";

const STATUS_META: Record<
  SmartBinStatus,
  { label: string; bg: string; text: string; ring: string }
> = {
  normal: {
    label: "Норма",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "#22c55e",
  },
  warning: {
    label: "Заполняется",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "#f59e0b",
  },
  full: {
    label: "Переполнен",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "#ef4444",
  },
  fire: {
    label: "Пожар",
    bg: "bg-red-100",
    text: "text-red-800",
    ring: "#dc2626",
  },
  sos: {
    label: "SOS",
    bg: "bg-rose-100",
    text: "text-rose-800",
    ring: "#e11d48",
  },
  offline: {
    label: "Оффлайн",
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "#94a3b8",
  },
};

function StatusChip({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone: "good" | "warn";
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        tone === "good"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </span>
  );
}

function SectionCard({
  kind,
  status,
  fillLevel,
  distanceCm,
  lastReadAt,
  isOffline,
}: {
  kind: SmartBinSectionKey;
  status: SmartBinStatus;
  fillLevel: number | null;
  distanceCm: number | null;
  lastReadAt: string | null;
  isOffline: boolean;
}) {
  const statusMeta = STATUS_META[status];
  const ringValue = Math.max(0, Math.min(fillLevel ?? 0, 100));

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Секция
          </p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
            {SMART_BIN_LABELS[kind]}
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.bg} ${statusMeta.text}`}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
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
              stroke={statusMeta.ring}
              strokeWidth="10"
              strokeDasharray={`${ringValue * 2.64} ${264 - ringValue * 2.64}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-slate-950">
              {fillLevel != null ? `${fillLevel}%` : "--"}
            </span>
            <span className="text-[10px] text-slate-400">fillLevel</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Расстояние
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {distanceCm != null ? `${distanceCm} см` : "Нет данных"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Последнее чтение
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {lastReadAt
                ? format(new Date(lastReadAt), "dd.MM.yyyy HH:mm:ss")
                : "Еще не получено"}
            </p>
          </div>
        </div>
      </div>

      {isOffline ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Секция сейчас оффлайн. Если были прошлые данные, они сохранены на экране.
        </div>
      ) : null}
    </article>
  );
}

export default function AdminWasteContainersPage() {
  const source = resolveSmartBinRuntimeSource();

  if (source === "legacy") {
    return <AdminWasteContainersLegacyPage />;
  }

  const {
    bridgeError,
    bridgeOk,
    cluster,
    coordinatesLabel,
    geoError,
    loading,
    position,
    record,
    refresh,
    refreshing,
  } = useLiveSmartBin();

  const overallStatus = getSmartBinOverallStatus(record.sections);
  const overallFill = getSmartBinMaxFillLevel(record.sections);
  const overallMeta = STATUS_META[overallStatus];
  const sourceCopy = getSourceCopy(source);

  return (
    <div className="space-y-4">
      <header className="citizen-v2-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="citizen-v2-eyebrow">Smart Bin Live</p>
            <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Одна точка, две секции
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {sourceCopy.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : undefined}
            />
            {refreshing ? "Обновляем..." : "Обновить данные"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusChip
            icon={<MapPin size={14} />}
            label={`${record.locationLabel}: ${coordinatesLabel}`}
            tone={position.source === "browser" ? "good" : "warn"}
          />
          <StatusChip
            icon={bridgeOk ? <Wifi size={14} /> : <WifiOff size={14} />}
            label={bridgeOk ? sourceCopy.onlineLabel : sourceCopy.offlineLabel}
            tone={bridgeOk ? "good" : "warn"}
          />
          <StatusChip
            icon={<TriangleAlert size={14} />}
            label={`Главный статус: ${overallMeta.label}`}
            tone={overallStatus === "normal" ? "good" : "warn"}
          />
        </div>

        {geoError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {geoError}
          </div>
        ) : null}

        {bridgeError ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {bridgeError}
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="citizen-v2-panel !p-2">
          <div className="overflow-hidden rounded-2xl">
            <CityMap
              clusters={[cluster]}
              selectedId={cluster.id}
              center={{ lat: position.lat, lng: position.lng }}
              height="460px"
              className="rounded-2xl"
            />
          </div>
        </div>

        <aside className="citizen-v2-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                Live контейнер
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {record.label}
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${overallMeta.bg} ${overallMeta.text}`}
            >
              {overallMeta.label}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={14} className="text-slate-400" />
            {record.locationLabel}
          </div>

          <div className="mt-1 text-sm text-slate-500">{coordinatesLabel}</div>

          <div className="mt-5 flex h-32 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50">
            <SmartWasteIcon size={62} />
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              На карте
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
              {overallFill}%
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Маркер показывает самый высокий fillLevel среди двух секций.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {SMART_BIN_SECTION_KEYS.map((key) => {
              const section = record.sections[key];

              return (
                <SectionCard
                  key={key}
                  kind={key}
                  status={section.status}
                  fillLevel={section.fillLevel}
                  distanceCm={section.distanceCm}
                  lastReadAt={section.lastReadAt}
                  isOffline={section.isOffline}
                />
              );
            })}
          </div>

          <div className="mt-4 text-xs text-slate-400">
            {loading && !record.lastUpdatedAt
              ? "Идет первое чтение данных..."
              : record.lastUpdatedAt
                ? `${sourceCopy.lastUpdatedPrefix}: ${format(new Date(record.lastUpdatedAt), "dd.MM.yyyy HH:mm:ss")}`
                : sourceCopy.emptyState}
          </div>
        </aside>
      </div>
    </div>
  );
}

function getSourceCopy(source: Exclude<SmartBinRuntimeSource, "legacy">) {
  if (source === "cloud") {
    return {
      description:
        "Карта берет координаты браузера, а заполненность секций приходит через защищенный cloud API.",
      onlineLabel: "Cloud smart-bin: подключено",
      offlineLabel: "Cloud smart-bin: оффлайн",
      lastUpdatedPrefix: "Последнее обновление cloud",
      emptyState: "Данные из cloud smart-bin еще не получены.",
    };
  }

  return {
    description:
      "Карта берет координаты ноутбука, а заполненность секций приходит с ESP32 через локальный bridge.",
    onlineLabel: "ESP32: подключено",
    offlineLabel: "ESP32: оффлайн",
    lastUpdatedPrefix: "Последнее обновление bridge",
    emptyState: "Данные от bridge еще не получены.",
  };
}
