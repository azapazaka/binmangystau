"use client";

import type {
  AdminAnalyticsViewModel,
  AnalyticsCategoryPoint,
  AnalyticsDistrictPoint,
  AnalyticsTimelinePoint,
} from "@/lib/admin-analytics";

export function TimelineChart({
  points,
  compact = false,
}: {
  points: AnalyticsTimelinePoint[];
  compact?: boolean;
}) {
  if (points.length === 0) {
    return (
      <div className="panel-muted-card grid min-h-[220px] place-items-center rounded-[1.8rem] border-dashed p-6 text-center">
        <div>
          <p className="panel-section-title text-xl font-semibold">Пока недостаточно данных для графика</p>
          <p className="panel-copy mt-3 text-sm leading-7">
            Когда в системе накопится история заявок, здесь появится временная динамика.
          </p>
        </div>
      </div>
    );
  }

  const peak = Math.max(...points.map((point) => point.count), 1);
  const width = 760;
  const height = compact ? 220 : 280;
  const paddingX = 24;
  const paddingTop = 24;
  const paddingBottom = 42;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;
  const stepX = points.length === 1 ? 0 : chartWidth / (points.length - 1);
  const polyline = points
    .map((point, index) => {
      const x = paddingX + index * stepX;
      const y = paddingTop + chartHeight - (point.count / peak) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPath = [
    `M ${paddingX} ${height - paddingBottom}`,
    ...points.map((point, index) => {
      const x = paddingX + index * stepX;
      const y = paddingTop + chartHeight - (point.count / peak) * chartHeight;
      return `L ${x} ${y}`;
    }),
    `L ${paddingX + chartWidth} ${height - paddingBottom}`,
    "Z",
  ].join(" ");
  const total = points.reduce((sum, point) => sum + point.count, 0);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`panel-title font-semibold ${compact ? "text-3xl" : "text-4xl"}`}>{total}</p>
          <p className="panel-copy text-sm">заявок за выбранный период</p>
        </div>
        {!compact ? (
          <div className="flex gap-6 text-sm">
            <div>
              <p className="panel-kicker text-[11px] uppercase tracking-[0.24em]">Пик</p>
              <p className="panel-section-title mt-2 font-semibold">{peak}</p>
            </div>
            <div>
              <p className="panel-kicker text-[11px] uppercase tracking-[0.24em]">Точек</p>
              <p className="panel-section-title mt-2 font-semibold">{points.length}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel-muted-card rounded-[1.8rem] p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full ${compact ? "h-[220px]" : "h-[280px]"}`}
          role="img"
          aria-label="График потока обращений"
        >
          <defs>
            <linearGradient id="analytics-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(37,99,235,0.45)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.04)" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight * ratio;
            return (
              <line
                key={ratio}
                x1={paddingX}
                x2={paddingX + chartWidth}
                y1={y}
                y2={y}
                stroke="rgba(116,136,173,0.18)"
                strokeDasharray="4 8"
              />
            );
          })}
          <path d={areaPath} fill="url(#analytics-area-fill)" />
          <polyline
            points={polyline}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((point, index) => {
            const x = paddingX + index * stepX;
            const y = paddingTop + chartHeight - (point.count / peak) * chartHeight;
            return (
              <g key={point.date}>
                <circle cx={x} cy={y} r="6" fill="#fff" stroke="#1d4ed8" strokeWidth="3" />
                <text x={x} y={height - 14} textAnchor="middle" fill="currentColor" fontSize="12">
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function CategoryDonut({
  categories,
  compact = false,
}: {
  categories: AnalyticsCategoryPoint[];
  compact?: boolean;
}) {
  const total = categories.reduce((sum, category) => sum + category.value, 0);

  if (total === 0) {
    return (
      <div className="panel-muted-card rounded-[1.7rem] border-dashed p-5 text-sm panel-copy">
        Недостаточно данных по категориям, чтобы построить распределение.
      </div>
    );
  }

  const gradient = categories
    .filter((category) => category.value > 0)
    .reduce<{ color: string; start: number; end: number }[]>((segments, category, index) => {
      const start = index === 0 ? 0 : segments[index - 1]!.end;
      const end = start + category.share * 100;
      segments.push({ color: category.color, start, end });
      return segments;
    }, [])
    .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
    .join(", ");

  const ringSize = compact ? "h-[170px] w-[170px]" : "h-[220px] w-[220px]";
  const visibleCategories = categories.filter((category) => category.value > 0).slice(0, compact ? 3 : categories.length);

  return (
    <div className={`grid gap-5 ${compact ? "" : "xl:grid-cols-[220px_1fr] xl:items-center"}`}>
      <div className="grid justify-items-center">
        <div
          className={`mx-auto flex ${ringSize} items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-surface-strong)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]`}
        >
          <div
            className="relative h-full w-full rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
          >
            <div className="absolute inset-[22%] grid place-items-center rounded-full bg-[var(--panel-surface)] text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div>
                <p className="panel-kicker text-[11px] uppercase tracking-[0.24em]">Всего</p>
                <p className={`panel-title mt-2 font-semibold ${compact ? "text-2xl" : "text-3xl"}`}>{total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {visibleCategories.map((category) => (
          <div key={category.key} className="panel-muted-card rounded-[1.3rem] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="panel-section-title text-sm font-semibold">{category.label}</span>
              </div>
              <span className="panel-copy text-sm">{category.value}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/45">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(category.share * 100, category.value > 0 ? 6 : 0)}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusSegments({ statuses }: { statuses: AdminAnalyticsViewModel["statuses"] }) {
  return (
    <div className="grid gap-5">
      <div className="overflow-hidden rounded-full bg-[var(--panel-muted-surface)]">
        <div className="flex h-6">
          {statuses.map((status) => (
            <div
              key={status.key}
              title={`${status.label}: ${status.value}`}
              className="h-full transition-[width] duration-300"
              style={{
                width: `${status.share * 100}%`,
                background:
                  status.key === "open"
                    ? "linear-gradient(90deg,#fb7185,#f43f5e)"
                    : status.key === "in_progress"
                      ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                      : "linear-gradient(90deg,#34d399,#10b981)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {statuses.map((status) => (
          <div key={status.key} className="panel-muted-card rounded-[1.4rem] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="panel-section-title text-sm font-semibold">{status.label}</p>
              <span className="panel-copy text-sm">{status.value}</span>
            </div>
            <p className="panel-copy mt-2 text-sm">{Math.round(status.share * 100)}% от всех кластеров</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeverityStrip({ severity }: { severity: AdminAnalyticsViewModel["severity"] }) {
  if (severity.length === 0) {
    return (
      <div className="panel-muted-card rounded-[1.7rem] border-dashed p-5 text-sm panel-copy">
        Данные по нагрузке появятся после накопления обращений
      </div>
    );
  }

  const peak = Math.max(...severity.map((item) => item.severity), 1);

  return (
    <div className="grid gap-3">
      {severity.slice(0, 4).map((item, index) => (
        <div key={item.clusterId} className="panel-muted-card rounded-[1.4rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="panel-kicker text-[11px] uppercase tracking-[0.24em]">#{index + 1}</p>
              <p className="panel-section-title mt-2 text-sm font-semibold">{item.address}</p>
            </div>
            <span className="panel-title text-2xl font-semibold">{item.severity}</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/45">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#1d4ed8,#60a5fa)]"
              style={{ width: `${(item.severity / peak) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DistrictHistogram({
  districts,
}: {
  districts: AnalyticsDistrictPoint[];
}) {
  if (districts.length === 0) {
    return (
      <div className="panel-muted-card rounded-[1.7rem] border-dashed p-5 text-sm panel-copy">
        Районная статистика появится после первых кластеров
      </div>
    );
  }

  const peak = Math.max(...districts.map((district) => district.value), 1);

  return (
    <div className="grid gap-3">
      {districts.map((district) => (
        <div key={district.district} className="panel-muted-card rounded-[1.5rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="panel-section-title text-sm font-semibold">{district.district}</span>
            <span className="panel-copy text-sm">{district.value}</span>
          </div>
          <div className="mt-4 h-3 rounded-full bg-white/45">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#d97f49,#f1c27d)]"
              style={{ width: `${(district.value / peak) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
