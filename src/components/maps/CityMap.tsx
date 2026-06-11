import { useEffect, useRef, useState } from "react";

import { env } from "@/lib/env";
import type { ClusterRecord } from "@/types";

type LeafletModule = typeof import("leaflet");

type CityMapProps = {
  clusters: ClusterRecord[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: string;
  className?: string;
  navigationPosition?: "top-right" | "bottom-right";
};

export function CityMap({
  clusters,
  selectedId,
  onSelect,
  height = "100%",
  className,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<LeafletModule["map"]> | null>(null);
  const markersRef = useRef<ReturnType<LeafletModule["marker"]>[]>([]);
  const leafletRef = useRef<LeafletModule | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getClusterColor(cluster: ClusterRecord) {
    if (cluster.status === "closed") return "#94a3b8";
    if (cluster.effectiveVisualSeverity === "high" || cluster.priorityScore >= 66) return "#ef4444";
    if (cluster.effectiveVisualSeverity === "medium" || cluster.priorityScore >= 33) return "#f59e0b";
    return "#22c55e";
  }

  // Load leaflet + init map
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const [L] = await Promise.all([
          import("leaflet"),
          import("leaflet/dist/leaflet.css"),
        ]);

        if (cancelled || !containerRef.current) return;

        leafletRef.current = L.default ?? (L as unknown as LeafletModule);
        const Lib = leafletRef.current;

        const map = Lib.map(containerRef.current, {
          center: [env.defaultLat, env.defaultLng],
          zoom: 12,
          zoomControl: true,
        });

        Lib.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        mapRef.current = map;
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          console.error("Leaflet init failed:", e);
          setError("Карта не загрузилась");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    clusters.forEach((cluster) => {
      const color = getClusterColor(cluster);
      const isSelected = cluster.id === selectedId;
      const size = isSelected ? 38 : 30;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:${isSelected ? 3 : 2}px solid white;
          box-shadow:0 2px 10px rgba(0,0,0,.3);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:${isSelected ? 13 : 11}px;font-weight:700;
          font-family:Inter,system-ui,sans-serif;cursor:pointer;
        ">${cluster.reportCount}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon });
      marker.on("click", () => onSelect?.(cluster.id));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [clusters, selectedId, onSelect, ready]);

  if (error) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          borderRadius: "inherit",
        }}
      >
        <p style={{ color: "#64748b", fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height }}
    />
  );
}
