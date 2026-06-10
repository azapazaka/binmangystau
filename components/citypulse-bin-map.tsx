"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { env } from "@/lib/env";
import {
  formatLastSeen,
  getBinSignalColor,
  getBinStatusLabel,
  getBinWasteLabel,
} from "@/lib/citypulse-admin-ui";
import type { SmartBinRecord } from "@/types";

import { usePanelTheme } from "./panel-theme-context";

type CityPulseBinMapProps = {
  bins: SmartBinRecord[];
};

export function CityPulseBinMap({ bins }: CityPulseBinMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = usePanelTheme();
  const [selectedBinId, setSelectedBinId] = useState<string | null>(bins[0]?.id ?? null);

  const selectedBin = useMemo(
    () => bins.find((bin) => bin.id === selectedBinId) ?? bins[0] ?? null,
    [bins, selectedBinId],
  );

  useEffect(() => {
    if (!bins.some((bin) => bin.id === selectedBinId)) {
      setSelectedBinId(bins[0]?.id ?? null);
    }
  }, [bins, selectedBinId]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function start() {
      if (!containerRef.current || !env.mapboxToken || bins.length === 0) {
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
        center: [51.1694, 43.6532],
        zoom: 11.4,
        pitch: 34,
        bearing: -9,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const bounds = new mapboxgl.LngLatBounds();
      const handleResize = () => map.resize();

      for (const bin of bins) {
        bounds.extend([bin.lng, bin.lat]);

        const markerNode = document.createElement("button");
        const color = getBinSignalColor(bin.status, bin.fillLevel);
        const isAlert = bin.status === "fire" || bin.status === "sos";

        markerNode.type = "button";
        markerNode.style.width = isAlert ? "28px" : "22px";
        markerNode.style.height = isAlert ? "28px" : "22px";
        markerNode.style.borderRadius = "999px";
        markerNode.style.border =
          bin.id === selectedBinId ? "3px solid #ffffff" : "2px solid rgba(255,255,255,0.9)";
        markerNode.style.background = color;
        markerNode.style.boxShadow = isAlert
          ? "0 0 0 10px rgba(239,68,68,0.18), 0 0 24px rgba(239,68,68,0.45)"
          : `0 0 0 8px ${hexToRgba(color, 0.18)}, 0 10px 22px rgba(15,23,42,0.34)`;
        markerNode.style.cursor = "pointer";
        markerNode.className = isAlert ? "citypulse-alert-marker" : "citypulse-marker";
        markerNode.onclick = () => setSelectedBinId(bin.id);

        const popup = new mapboxgl.Popup({ offset: 22 }).setHTML(`
          <div style="min-width:220px;max-width:248px;padding:2px 2px 0;font-family:IBM Plex Sans,system-ui,sans-serif;color:#e5e7eb">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
              <strong style="font-size:14px;color:#f9fafb">${bin.label}</strong>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${color}">${getBinStatusLabel(bin.status)}</span>
            </div>
            <div style="display:grid;grid-template-columns:max-content 1fr;gap:7px 12px;font-size:12px;line-height:1.45">
              <span style="color:#94a3b8">ID</span><span style="color:#f8fafc">${bin.id}</span>
              <span style="color:#94a3b8">Район</span><span style="color:#f8fafc">${bin.district}</span>
              <span style="color:#94a3b8">Тип</span><span style="color:#f8fafc">${getBinWasteLabel(bin)}</span>
              <span style="color:#94a3b8">Заполненность</span><span style="color:#f8fafc">${bin.fillLevel}%</span>
              <span style="color:#94a3b8">Температура</span><span style="color:#f8fafc">${bin.temperature}°C</span>
              <span style="color:#94a3b8">Сигнал</span><span style="color:#f8fafc">${formatLastSeen(bin.lastSeen)}</span>
              <span style="color:#94a3b8">Источник</span><span style="color:#f8fafc">${bin.source}</span>
            </div>
          </div>
        `);

        new mapboxgl.Marker(markerNode)
          .setLngLat([bin.lng, bin.lat])
          .setPopup(popup)
          .addTo(map);
      }

      map.on("load", () => {
        requestAnimationFrame(() => {
          map.resize();
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 80, maxZoom: 13.2 });
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
  }, [bins, selectedBinId, theme]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
      <div className="panel-surface overflow-hidden rounded-[2rem]">
        {env.mapboxToken ? (
          <div ref={containerRef} className="panel-map-canvas h-[620px] w-full" />
        ) : (
          <div className="grid h-[620px] gap-3 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,#030712_0%,#101826_100%)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Aktau grid</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">Карта контейнеров работает и в fallback-режиме</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.26em] text-white">
                Актау
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {bins.map((bin) => {
                const color = getBinSignalColor(bin.status, bin.fillLevel);

                return (
                  <button
                    key={bin.id}
                    type="button"
                    onClick={() => setSelectedBinId(bin.id)}
                    className="rounded-[1.45rem] border border-white/10 bg-white/5 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`block h-3.5 w-3.5 rounded-full ${
                            bin.status === "fire" || bin.status === "sos" ? "citypulse-alert-dot" : ""
                          }`}
                          style={{
                            backgroundColor: color,
                            boxShadow: `0 0 0 8px ${hexToRgba(color, 0.16)}`,
                          }}
                        />
                        <span className="text-sm font-semibold text-white">{bin.label}</span>
                      </div>
                      <span className="text-sm text-slate-300">{bin.fillLevel}%</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{bin.district}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {getBinStatusLabel(bin.status)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedBin ? (
        <aside className="panel-surface rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Контейнер</p>
              <h3 className="panel-title mt-2 text-3xl font-semibold">{selectedBin.label}</h3>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-950"
              style={{ backgroundColor: getBinSignalColor(selectedBin.status, selectedBin.fillLevel) }}
            >
              {getBinStatusLabel(selectedBin.status)}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {[
              { label: "Район", value: selectedBin.district },
              { label: "Тип отходов", value: getBinWasteLabel(selectedBin) },
              { label: "Заполненность", value: `${selectedBin.fillLevel}%` },
              { label: "Температура", value: `${selectedBin.temperature}°C` },
              { label: "Последний сигнал", value: formatLastSeen(selectedBin.lastSeen) },
              { label: "Источник", value: selectedBin.source },
            ].map((item) => (
              <div key={item.label} className="panel-muted-card rounded-[1.35rem] p-4">
                <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">{item.label}</p>
                <p className="panel-section-title mt-3 text-base font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
