"use client";

import { useMemo } from "react";

import { filterTimelineByPeriod, type AdminAnalyticsViewModel } from "@/lib/admin-analytics";

import { CategoryDonut, DistrictHistogram, TimelineChart } from "./admin-analytics-charts";

type AdminAnalyticsPreviewProps = {
  model: AdminAnalyticsViewModel;
};

export function AdminAnalyticsPreview({ model }: AdminAnalyticsPreviewProps) {
  const timeline = useMemo(() => filterTimelineByPeriod(model.timeline, "30d"), [model.timeline]);

  return (
    <section className="panel-surface rounded-[2rem] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Обзор</p>
          <h2 className="panel-section-title mt-2 text-2xl font-semibold">Краткая аналитика</h2>
        </div>
        <div className="panel-muted-card rounded-full px-4 py-3 text-sm">
          <span className="panel-copy">Лидирует: </span>
          <span className="panel-section-title font-semibold">{model.highlights.topCategory}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <article className="panel-muted-card rounded-[2rem] p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="panel-section-title text-lg font-semibold">Динамика</h3>
            <span className="panel-secondary-button rounded-full px-3 py-1 text-xs font-semibold">
              30 дней
            </span>
          </div>
          <div className="mt-5">
            <TimelineChart points={timeline} />
          </div>
        </article>

        <article className="panel-muted-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="panel-section-title text-lg font-semibold">Категории</h3>
            <span className="panel-copy text-sm">Структура обращений</span>
          </div>
          <div className="mt-5">
            <CategoryDonut categories={model.categories} />
          </div>
        </article>

        <article className="panel-muted-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="panel-section-title text-lg font-semibold">Районы</h3>
            <span className="panel-copy text-sm">Текущая плотность</span>
          </div>
          <div className="mt-5">
            <DistrictHistogram districts={model.districts.slice(0, 4)} />
          </div>
        </article>
      </div>
    </section>
  );
}
