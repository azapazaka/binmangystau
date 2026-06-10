"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AI_STATUS_META, STATUS_META } from "@/lib/constants";
import { env } from "@/lib/env";
import {
  getSeverityLevel,
  getSeverityLevelSummary,
  SEVERITY_LEVEL_META,
  type SeverityLevel,
} from "@/lib/severity-levels";
import type { ClusterRecord } from "@/types";

import { usePanelTheme } from "./panel-theme-context";

type AdminSeverityMapProps = {
  clusters: ClusterRecord[];
};

type SeverityFilter = SeverityLevel | "all";

export function AdminSeverityMap({ clusters }: AdminSeverityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = usePanelTheme();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    clusters[0]?.id ?? null,
  );

  const sortedClusters = useMemo(
    () => [...clusters].sort((left, right) => right.severity - left.severity),
    [clusters],
  );
  const summary = useMemo(() => getSeverityLevelSummary(sortedClusters), [sortedClusters]);
  const filteredClusters = useMemo(() => {
    if (filter === "all") {
      return sortedClusters;
    }

    return sortedClusters.filter((cluster) => getSeverityLevel(cluster.severity) === filter);
  }, [filter, sortedClusters]);

  const selectedCluster =
    filteredClusters.find((cluster) => cluster.id === selectedClusterId) ??
    filteredClusters[0] ??
    null;

  useEffect(() => {
    if (!filteredClusters.some((cluster) => cluster.id === selectedClusterId)) {
      setSelectedClusterId(filteredClusters[0]?.id ?? null);
    }
  }, [filteredClusters, selectedClusterId]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function start() {
      if (!containerRef.current || !env.mapboxToken || filteredClusters.length === 0) {
        return;
      }

      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");

      if (disposed || !containerRef.current) {
        return;
      }

      mapboxgl.accessToken = env.mapboxToken;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: theme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11",
        center: [filteredClusters[0].lng, filteredClusters[0].lat],
        zoom: 11.6,
        pitch: 42,
        bearing: -12,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const bounds = new mapboxgl.LngLatBounds();
      const handleResize = () => map.resize();

      filteredClusters.forEach((cluster) => {
        bounds.extend([cluster.lng, cluster.lat]);

        const level = getSeverityLevel(cluster.severity);
        const markerMeta = SEVERITY_LEVEL_META[level];
        const markerNode = document.createElement("button");

        markerNode.type = "button";
        markerNode.setAttribute("aria-label", cluster.address ?? "Проблемная точка");
        markerNode.style.width = level === "critical" ? "28px" : level === "medium" ? "22px" : "18px";
        markerNode.style.height = markerNode.style.width;
        markerNode.style.borderRadius = "999px";
        markerNode.style.border =
          cluster.id === selectedClusterId
            ? "3px solid #ffffff"
            : "2px solid rgba(255,255,255,0.72)";
        markerNode.style.background = markerMeta.color;
        markerNode.style.boxShadow = `0 0 0 10px ${markerMeta.glowColor}, 0 18px 30px rgba(15,23,42,0.35)`;
        markerNode.style.cursor = "pointer";
        markerNode.onclick = () => setSelectedClusterId(cluster.id);

        const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
          <div style="max-width:260px;font-family:IBM Plex Sans,system-ui,sans-serif">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
              <strong style="color:#0f172a">${markerMeta.label}</strong>
              <span style="font-size:12px;color:#475569">Score ${cluster.severity}</span>
            </div>
            <p style="margin:8px 0 0;color:#0f172a;font-size:13px">${cluster.address ?? "Адрес уточняется"}</p>
            <p style="margin:8px 0 0;color:#64748b;font-size:12px">Координаты: ${cluster.lat.toFixed(5)}, ${cluster.lng.toFixed(5)}</p>
            <p style="margin:8px 0 0;color:#64748b;font-size:12px">Жалоб: ${cluster.reportCount} · Статус: ${STATUS_META[cluster.status].label}</p>
          </div>
        `);

        new mapboxgl.Marker(markerNode)
          .setLngLat([cluster.lng, cluster.lat])
          .setPopup(popup)
          .addTo(map);
      });

      map.on("load", () => {
        requestAnimationFrame(() => {
          map.resize();
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 90, maxZoom: 13.4 });
          }
        });
      });

      window.addEventListener("resize", handleResize);

      cleanup = () => {
        window.removeEventListener("resize", handleResize);
        map.remove();
      };
    }

    void start();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [filteredClusters, selectedClusterId, theme]);

  const activeLevel = selectedCluster ? getSeverityLevel(selectedCluster.severity) : null;

  return (
    <div className="grid gap-6">
      <section className="panel-surface rounded-[2.2rem] p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Severity command map</p>
            <h2 className="panel-title mt-3 text-4xl leading-none md:text-5xl">Карта приоритетов ремонта</h2>
            <p className="panel-copy mt-4 text-sm leading-7 md:text-base">
              Красные точки требуют быстрой реакции, жёлтые должны войти в ближайший рабочий план,
              зелёные остаются в низком приоритете. Цвет зависит только от важности дефекта.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {([
              { key: "all", label: "Все точки" },
              { key: "critical", label: "Критичные" },
              { key: "medium", label: "Средние" },
              { key: "low", label: "Низкие" },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === item.key
                    ? "panel-primary-button"
                    : "panel-secondary-button"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(["critical", "medium", "low"] as SeverityLevel[]).map((level) => (
            <article key={level} className="panel-muted-card rounded-[1.6rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="block h-3.5 w-3.5 rounded-full"
                    style={{
                      backgroundColor: SEVERITY_LEVEL_META[level].color,
                      boxShadow: `0 0 0 8px ${SEVERITY_LEVEL_META[level].glowColor}`,
                    }}
                  />
                  <p className="panel-section-title text-sm font-semibold">
                    {SEVERITY_LEVEL_META[level].shortLabel}
                  </p>
                </div>
                <span className="panel-title text-3xl font-semibold">{summary[level]}</span>
              </div>
              <p className="panel-copy mt-4 text-sm leading-7">{SEVERITY_LEVEL_META[level].description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <div className="panel-surface overflow-hidden rounded-[2rem]">
          {env.mapboxToken ? (
            <div ref={containerRef} className="panel-map-canvas h-[620px] w-full" />
          ) : (
            <div className="grid h-[620px] gap-4 bg-[radial-gradient(circle_at_top_left,_rgba(225,75,59,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(36,163,106,0.12),_transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Map preview</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">
                    Подключите Mapbox token для живой операторской карты
                  </h3>
                </div>
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                  Алматы
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredClusters.slice(0, 6).map((cluster) => {
                  const level = getSeverityLevel(cluster.severity);

                  return (
                    <button
                      key={cluster.id}
                      type="button"
                      onClick={() => setSelectedClusterId(cluster.id)}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="block h-3.5 w-3.5 rounded-full"
                            style={{
                              backgroundColor: SEVERITY_LEVEL_META[level].color,
                              boxShadow: `0 0 0 8px ${SEVERITY_LEVEL_META[level].glowColor}`,
                            }}
                          />
                          <span className="text-sm font-semibold text-white">
                            {SEVERITY_LEVEL_META[level].shortLabel}
                          </span>
                        </div>
                        <span className="text-sm text-slate-300">Score {cluster.severity}</span>
                      </div>
                      <p className="mt-4 text-base font-medium text-white">
                        {cluster.address ?? "Адрес уточняется"}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        Жалоб: {cluster.reportCount} · {STATUS_META[cluster.status].label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5">
          {selectedCluster ? (
            <aside className="panel-surface rounded-[2rem] p-5">
              <div className="flex flex-wrap items-center gap-3">
                {activeLevel ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${SEVERITY_LEVEL_META[activeLevel].tone}`}
                  >
                    {SEVERITY_LEVEL_META[activeLevel].label}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${STATUS_META[selectedCluster.status].tone}`}
                >
                  {STATUS_META[selectedCluster.status].label}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${AI_STATUS_META[selectedCluster.aiValidationStatus].tone}`}
                >
                  {AI_STATUS_META[selectedCluster.aiValidationStatus].label}
                </span>
              </div>

              <h3 className="panel-title mt-4 text-3xl font-semibold">
                {selectedCluster.address ?? "Адрес уточняется"}
              </h3>
              <p className="panel-copy mt-3 text-sm leading-7">
                Карточка помогает оператору быстро понять срочность дефекта, район, статус
                обработки и объём накопленных обращений.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="panel-muted-card rounded-[1.3rem] p-4">
                  <p className="panel-kicker text-xs uppercase tracking-[0.24em]">Severity score</p>
                  <p className="panel-title mt-2 text-3xl font-semibold">{selectedCluster.severity}</p>
                </div>
                <div className="panel-muted-card rounded-[1.3rem] p-4">
                  <p className="panel-kicker text-xs uppercase tracking-[0.24em]">Жалоб</p>
                  <p className="panel-title mt-2 text-3xl font-semibold">{selectedCluster.reportCount}</p>
                </div>
                <div className="panel-muted-card rounded-[1.3rem] p-4">
                  <p className="panel-kicker text-xs uppercase tracking-[0.24em]">Район</p>
                  <p className="panel-title mt-2 text-lg font-semibold">
                    {selectedCluster.district ?? "Алматы"}
                  </p>
                </div>
                <div className="panel-muted-card rounded-[1.3rem] p-4">
                  <p className="panel-kicker text-xs uppercase tracking-[0.24em]">Обновлено</p>
                  <p className="panel-title mt-2 text-lg font-semibold">
                    {new Date(selectedCluster.updatedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>

              <div className="panel-muted-card mt-3 rounded-[1.3rem] p-4">
                <p className="panel-kicker text-xs uppercase tracking-[0.24em]">Координаты</p>
                <p className="panel-title mt-2 text-lg font-semibold">
                  {selectedCluster.lat.toFixed(5)}, {selectedCluster.lng.toFixed(5)}
                </p>
              </div>
            </aside>
          ) : (
            <div className="panel-muted-card rounded-[2rem] border-dashed p-6 text-sm panel-copy">
              По выбранному фильтру нет активных точек.
            </div>
          )}

          <section className="panel-surface rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Hot list</p>
                <h3 className="panel-title mt-2 text-2xl font-semibold">Самые важные точки</h3>
              </div>
              <span className="panel-badge rounded-full px-4 py-2 text-sm font-medium">
                {filteredClusters.length} точек
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {filteredClusters.slice(0, 5).map((cluster, index) => {
                const level = getSeverityLevel(cluster.severity);
                const isSelected = selectedClusterId === cluster.id;

                return (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => setSelectedClusterId(cluster.id)}
                    className={`grid gap-3 rounded-[1.4rem] border px-4 py-4 text-left transition md:grid-cols-[0.12fr_1fr_0.22fr] ${
                      isSelected ? "panel-table-row-active" : "panel-table-row border-transparent"
                    }`}
                  >
                    <div className="text-lg font-semibold">#{index + 1}</div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className="block h-3.5 w-3.5 rounded-full"
                          style={{
                            backgroundColor: SEVERITY_LEVEL_META[level].color,
                            boxShadow: `0 0 0 8px ${SEVERITY_LEVEL_META[level].glowColor}`,
                          }}
                        />
                        <span className="font-semibold">{cluster.address ?? "Адрес уточняется"}</span>
                      </div>
                      <p className={`mt-2 text-sm ${isSelected ? "opacity-70" : "panel-copy"}`}>
                        {SEVERITY_LEVEL_META[level].shortLabel} · {STATUS_META[cluster.status].label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.24em] opacity-70">Score</p>
                      <p className="mt-1 text-2xl font-semibold">{cluster.severity}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
