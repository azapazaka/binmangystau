"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import { CityMap } from "@/components/city-map";
import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import type { ClusterRecord, ReportCategory } from "@/types";

type PublicMapClientProps = {
  initialClusters: ClusterRecord[];
};

const SESSION_NOW = Date.now();

export function PublicMapClient({ initialClusters }: PublicMapClientProps) {
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [period, setPeriod] = useState<"week" | "month" | "all">("all");
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    initialClusters[0]?.id ?? null,
  );
  const filteredClusters = useMemo(() => {
    const cutoffDays = period === "week" ? 7 : period === "month" ? 30 : null;

    return initialClusters.filter((cluster) => {
      if (category !== "all" && cluster.category !== category) {
        return false;
      }

      if (!cutoffDays) {
        return true;
      }

      const cutoff = SESSION_NOW - cutoffDays * 24 * 60 * 60 * 1000;
      return new Date(cluster.updatedAt).getTime() >= cutoff;
    });
  }, [category, initialClusters, period]);

  const selectedCluster =
    filteredClusters.find((cluster) => cluster.id === selectedClusterId) ??
    filteredClusters[0] ??
    null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-[1.8rem] border border-white/60 bg-white/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Public map</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Карта городских проблем Алматы
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {(["all", ...Object.keys(CATEGORY_META)] as Array<ReportCategory | "all">).map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === value
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {value === "all" ? "Все" : CATEGORY_META[value].label}
              </button>
            ),
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {(["week", "month", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                period === value
                  ? "bg-amber-400 text-slate-950"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100"
              }`}
            >
              {value === "week"
                ? "За неделю"
                : value === "month"
                  ? "За месяц"
                  : "За всё время"}
            </button>
          ))}
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Показано {filteredClusters.length}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CityMap
          clusters={filteredClusters}
          selectedClusterId={selectedCluster?.id}
          onSelectCluster={setSelectedClusterId}
          heightClassName="h-[560px]"
        />

        <div className="grid gap-4">
          {selectedCluster ? (
            <article className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur">
              {selectedCluster.representativePhotoUrl ? (
                <img
                  src={selectedCluster.representativePhotoUrl}
                  alt={selectedCluster.address ?? "Городская проблема"}
                  className="h-60 w-full rounded-[1.4rem] object-cover"
                />
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white"
                  style={{ backgroundColor: CATEGORY_META[selectedCluster.effectiveCategory].color }}
                >
                  {CATEGORY_META[selectedCluster.effectiveCategory].label}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${STATUS_META[selectedCluster.status].tone}`}
                >
                  {STATUS_META[selectedCluster.status].label}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                {selectedCluster.address ?? "Адрес уточняется"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {selectedCluster.reportCount} жалоб в одном кластере. Приоритет
                определяется количеством обращений, категорией и городской зоной.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.2rem] bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Score</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {selectedCluster.severity}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Район</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {selectedCluster.district ?? "Алматы"}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI status</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {selectedCluster.aiValidationStatus}
                  </p>
                </div>
              </div>
            </article>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
              Кластеры не найдены по выбранным фильтрам.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
