"use client";

import { useEffect, useMemo, useRef } from "react";

import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import { env } from "@/lib/env";
import type { ClusterRecord } from "@/types";

import { usePanelTheme } from "./panel-theme-context";

type CityMapProps = {
  clusters: ClusterRecord[];
  selectedClusterId?: string | null;
  onSelectCluster?: (clusterId: string) => void;
  heightClassName?: string;
};

export function CityMap({
  clusters,
  selectedClusterId,
  onSelectCluster,
  heightClassName = "h-[440px]",
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = usePanelTheme();

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function start() {
      if (!containerRef.current || !env.mapboxToken || clusters.length === 0) {
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
        style:
          theme === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/light-v11",
        center: [clusters[0].lng, clusters[0].lat],
        zoom: 11.4,
      });

      const bounds = new mapboxgl.LngLatBounds();
      const handleResize = () => map.resize();

      clusters.forEach((cluster) => {
        bounds.extend([cluster.lng, cluster.lat]);

        const markerNode = document.createElement("button");
        markerNode.type = "button";
        markerNode.className =
          "flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-lg";
        markerNode.style.background = CATEGORY_META[cluster.effectiveCategory].color;
        markerNode.style.outline =
          cluster.id === selectedClusterId ? "3px solid rgba(15, 23, 42, 0.85)" : "none";
        markerNode.onclick = () => onSelectCluster?.(cluster.id);

        const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
          <div style="max-width:240px;font-family:system-ui,sans-serif">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
              <strong>${CATEGORY_META[cluster.effectiveCategory].label}</strong>
              <span>${STATUS_META[cluster.status].label}</span>
            </div>
            <p style="margin:8px 0;color:#334155;font-size:13px">${cluster.address ?? "Адрес уточняется"}</p>
            <p style="margin:0;color:#64748b;font-size:12px">Жалобы: ${cluster.reportCount} · Приоритет: ${cluster.priorityScore}</p>
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
            map.fitBounds(bounds, { padding: 80, maxZoom: 13 });
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
  }, [clusters, onSelectCluster, selectedClusterId, theme]);

  const fallbackClusters = useMemo(() => clusters.slice(0, 4), [clusters]);

  return (
    <div className={`panel-surface overflow-hidden rounded-[2rem] ${heightClassName}`}>
      {env.mapboxToken ? (
        <div ref={containerRef} className="panel-map-canvas h-full w-full" />
      ) : (
        <div className="grid h-full gap-4 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Map fallback</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                Для локального просмотра карта работает и без Mapbox token
              </h3>
            </div>
            <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Алматы
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {fallbackClusters.map((cluster) => (
              <button
                key={cluster.id}
                type="button"
                onClick={() => onSelectCluster?.(cluster.id)}
                className="rounded-[1.4rem] border border-white bg-white/80 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">
                    {CATEGORY_META[cluster.effectiveCategory].label}
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {STATUS_META[cluster.status].label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{cluster.address}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                  {cluster.reportCount} жалоб · приоритет {cluster.priorityScore}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
