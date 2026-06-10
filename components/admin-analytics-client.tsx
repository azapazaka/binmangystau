"use client";

import { useMemo, useState } from "react";

import {
  filterTimelineByPeriod,
  type AdminAnalyticsPeriod,
  type AdminAnalyticsViewModel,
} from "@/lib/admin-analytics";

import {
  CategoryDonut,
  DistrictHistogram,
  SeverityStrip,
  StatusSegments,
  TimelineChart,
} from "./admin-analytics-charts";

type AdminAnalyticsClientProps = {
  model: AdminAnalyticsViewModel;
};

const PERIOD_OPTIONS: Array<{ value: AdminAnalyticsPeriod; label: string }> = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "all", label: "Всё" },
];

export function AdminAnalyticsClient({ model }: AdminAnalyticsClientProps) {
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>("30d");
  const filteredTimeline = useMemo(
    () => filterTimelineByPeriod(model.timeline, period),
    [model.timeline, period],
  );

  return (
    <div className="grid gap-6">
      <section className="panel-surface rounded-[2.4rem] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4">
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Аналитика</p>
            <h1 className="panel-title text-5xl">Аналитика оператора</h1>
            <p className="panel-copy max-w-3xl text-base leading-8">
              Сводка по обращениям, статусам и районам без лишнего шума. Здесь видно, где растёт
              нагрузка и куда команде лучше направить внимание в первую очередь.
            </p>
            <div className="flex flex-wrap gap-3">
              <SummaryChip label="Лидирует" value={model.highlights.topCategory} />
              <SummaryChip label="Закрытие" value={model.highlights.closureRate} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(model.kpis).map((item) => (
              <article
                key={item.label}
                className="panel-muted-card rounded-[1.8rem] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)]"
              >
                <p className="panel-kicker text-xs uppercase tracking-[0.28em]">{item.label}</p>
                <p className="panel-title mt-4 text-4xl font-semibold">{item.value}</p>
                <p className="panel-copy mt-3 text-sm leading-7">{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-surface rounded-[2rem] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Динамика</p>
            <h2 className="panel-section-title mt-2 text-3xl font-semibold">Динамика обращений</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                data-active={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  period === option.value
                    ? "panel-primary-button shadow-[0_16px_32px_rgba(15,23,42,0.14)]"
                    : "panel-secondary-button"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <TimelineChart points={filteredTimeline} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel-surface rounded-[2rem] p-5 md:p-6">
          <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Структура</p>
          <h2 className="panel-section-title mt-2 text-3xl font-semibold">Структура обращений</h2>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="panel-copy text-sm font-medium">Категории</p>
              <div className="mt-4">
                <CategoryDonut categories={model.categories} />
              </div>
            </div>
            <div>
              <p className="panel-copy text-sm font-medium">Статусы</p>
              <div className="mt-4">
                <StatusSegments statuses={model.statuses} />
              </div>
            </div>
          </div>
        </article>

        <article className="panel-surface rounded-[2rem] p-5 md:p-6">
          <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Районы</p>
          <h2 className="panel-section-title mt-2 text-3xl font-semibold">Районы и приоритет</h2>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="panel-copy text-sm font-medium">Распределение по районам</p>
              <div className="mt-4">
                <DistrictHistogram districts={model.districts} />
              </div>
            </div>

            <div>
              <p className="panel-copy text-sm font-medium">Приоритетные точки</p>
              <div className="mt-4">
                <SeverityStrip severity={model.severity} />
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-muted-card rounded-full px-4 py-3">
      <span className="panel-kicker text-[11px] uppercase tracking-[0.24em]">{label}</span>
      <span className="panel-section-title ml-3 text-sm font-semibold">{value}</span>
    </div>
  );
}
