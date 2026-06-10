"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
      if (!containerRef.current || bins.length === 0) {
        return;
      }

      const leaflet = await import("leaflet");

      if (disposed || !containerRef.current) {
        return;
      }

      const map = leaflet.map(containerRef.current, {
        attributionControl: true,
        center: [43.6532, 51.1694],
        zoom: 12,
        zoomControl: false,
      });

      leaflet.control.zoom({ position: "topright" }).addTo(map);

      leaflet.tileLayer(
        theme === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            theme === "dark"
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: theme === "dark" ? "abcd" : undefined,
          maxZoom: 19,
        },
      ).addTo(map);

      const bounds = leaflet.latLngBounds([]);

      for (const bin of bins) {
        const color = getBinSignalColor(bin.status, bin.fillLevel);
        const isAlert = bin.status === "fire" || bin.status === "sos";
        const isSelected = bin.id === selectedBinId;

        const marker = leaflet.marker([bin.lat, bin.lng], {
          icon: leaflet.divIcon({
            className: "citypulse-leaflet-marker-shell",
            html: `
              <span
                class="citypulse-leaflet-marker ${isAlert ? "citypulse-alert-marker" : ""} ${isSelected ? "citypulse-leaflet-marker-selected" : ""}"
                style="
                  --marker-color:${color};
                  width:${isAlert ? "28px" : "22px"};
                  height:${isAlert ? "28px" : "22px"};
                "
              ></span>
            `,
            iconSize: [isAlert ? 28 : 22, isAlert ? 28 : 22],
            iconAnchor: [isAlert ? 14 : 11, isAlert ? 14 : 11],
          }),
        });

        marker.on("click", () => setSelectedBinId(bin.id));

        marker.bindPopup(
          `
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
                <span style="color:#94a3b8">Последний сигнал</span><span style="color:#f8fafc">${formatLastSeen(bin.lastSeen)}</span>
                <span style="color:#94a3b8">Источник</span><span style="color:#f8fafc">${bin.source}</span>
              </div>
            </div>
          `,
          {
            closeButton: false,
            offset: leaflet.point(0, -4),
          },
        );

        marker.addTo(map);
        bounds.extend([bin.lat, bin.lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      }

      const resizeMap = () => map.invalidateSize();
      window.addEventListener("resize", resizeMap);
      requestAnimationFrame(() => map.invalidateSize());

      cleanup = () => {
        window.removeEventListener("resize", resizeMap);
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
        <div ref={containerRef} className="panel-map-canvas h-[620px] w-full" />
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
