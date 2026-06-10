"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

import { env } from "@/lib/env";

import { usePanelTheme } from "./panel-theme-context";

type PickedLocation = {
  lat: number;
  lng: number;
  address: string;
};

type LocationPickerModalProps = {
  isOpen: boolean;
  initialLocation?: PickedLocation | null;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
};

const KAZAKHSTAN_CENTER: [number, number] = [66.9237, 48.0196];
const KAZAKHSTAN_ZOOM = 4.2;

export function LocationPickerModal({
  isOpen,
  initialLocation = null,
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = usePanelTheme();
  const [draftLocation, setDraftLocation] = useState<PickedLocation | null>(initialLocation);
  const [isResolving, setIsResolving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftLocation(initialLocation);
    setMessage(null);
  }, [initialLocation, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isResolving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isResolving, onClose]);

  useEffect(() => {
    if (!isOpen || !containerRef.current || !env.mapboxToken) {
      return;
    }

    let disposed = false;
    let map: MapboxMap | null = null;
    let marker: MapboxMarker | null = null;
    let removeResizeListener: (() => void) | undefined;

    async function start() {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");

      if (disposed || !containerRef.current) {
        return;
      }

      mapboxgl.accessToken = env.mapboxToken;

      map = new mapboxgl.Map({
        container: containerRef.current,
        style:
          theme === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/light-v11",
        center: initialLocation
          ? [initialLocation.lng, initialLocation.lat]
          : KAZAKHSTAN_CENTER,
        zoom: initialLocation ? 14 : KAZAKHSTAN_ZOOM,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const placeMarker = (lat: number, lng: number) => {
        if (!marker) {
          marker = new mapboxgl.Marker({
            color: theme === "dark" ? "#f8fafc" : "#111827",
            draggable: false,
          })
            .setLngLat([lng, lat])
            .addTo(map!);
          return;
        }

        marker.setLngLat([lng, lat]);
      };

      if (initialLocation) {
        placeMarker(initialLocation.lat, initialLocation.lng);
      }

      map.on("click", async (event) => {
        const nextLat = event.lngLat.lat;
        const nextLng = event.lngLat.lng;

        placeMarker(nextLat, nextLng);
        setIsResolving(true);
        setMessage("Уточняем адрес по выбранной точке...");

        try {
          const response = await fetch(
            `/api/location/reverse?lat=${nextLat}&lng=${nextLng}`,
          );

          if (!response.ok) {
            throw new Error("Reverse geocoding failed.");
          }

          const payload = (await response.json()) as {
            location?: { address?: string };
          };
          const resolvedAddress =
            payload.location?.address?.trim() || "Локация уточняется";

          setDraftLocation({
            lat: nextLat,
            lng: nextLng,
            address: resolvedAddress,
          });
          setMessage("Точка выбрана. Адрес можно сохранить в форму.");
        } catch {
          setDraftLocation({
            lat: nextLat,
            lng: nextLng,
            address: "Локация уточняется",
          });
          setMessage("Точка выбрана, но адрес не удалось уточнить автоматически.");
        } finally {
          setIsResolving(false);
        }
      });

      map.on("load", () => {
        requestAnimationFrame(() => map?.resize());
      });

      const handleResize = () => map?.resize();
      window.addEventListener("resize", handleResize);
      removeResizeListener = () => window.removeEventListener("resize", handleResize);
    }

    void start();

    return () => {
      disposed = true;
      removeResizeListener?.();
      marker?.remove();
      map?.remove();
    };
  }, [initialLocation, isOpen, theme]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-picker-title"
        className="panel-surface w-full max-w-5xl rounded-[2rem] border border-[var(--panel-border)] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
      >
        <div className="flex flex-col gap-3 border-b border-[var(--panel-border)] pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">
              Location picker
            </p>
            <h2 id="location-picker-title" className="panel-title mt-2 text-3xl font-semibold">
              Выберите точку на карте
            </h2>
            <p className="panel-copy mt-3 max-w-3xl text-sm leading-7">
              Нажмите на нужное место, и мы попробуем определить адрес. После этого адрес
              вернётся в форму и его можно будет вручную уточнить.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="panel-secondary-button rounded-full px-4 py-2 text-sm font-semibold"
          >
            Закрыть
          </button>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          {env.mapboxToken ? (
            <div
              ref={containerRef}
              className="min-h-[420px] rounded-[1.6rem] border border-[var(--panel-border)]"
            />
          ) : (
            <div className="panel-muted-card grid min-h-[420px] place-items-center rounded-[1.6rem] border-dashed p-6 text-center">
              <div>
                <p className="panel-section-title text-xl font-semibold">
                  Карта сейчас недоступна
                </p>
                <p className="panel-copy mt-3 max-w-md text-sm leading-7">
                  Попробуйте определить местоположение автоматически или введите адрес вручную.
                </p>
              </div>
            </div>
          )}

          <aside className="grid gap-4">
            <div className="panel-muted-card rounded-[1.5rem] p-5">
              <p className="panel-kicker text-xs uppercase tracking-[0.28em]">
                Выбранное место
              </p>
              <p className="panel-section-title mt-3 text-xl font-semibold">
                {draftLocation?.address ?? "Точка ещё не выбрана"}
              </p>
              <p className="panel-copy mt-3 text-sm leading-7">
                {message ??
                  "Выберите место на карте. Мы не показываем координаты пользователю и сохраняем только понятный адрес."}
              </p>
            </div>

            <div className="panel-muted-card rounded-[1.5rem] p-5">
              <p className="panel-kicker text-xs uppercase tracking-[0.28em]">
                Как это работает
              </p>
              <div className="mt-4 grid gap-3 text-sm leading-7 panel-copy">
                <p>1. Нажмите на точку, где находится проблема.</p>
                <p>2. Дождитесь автоматического определения адреса.</p>
                <p>3. Сохраните точку и при необходимости уточните адрес уже в форме.</p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="panel-secondary-button rounded-full px-5 py-3 text-sm font-semibold"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!draftLocation || isResolving}
                onClick={() => draftLocation && onConfirm(draftLocation)}
                className="panel-primary-button rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResolving ? "Определяем адрес..." : "Использовать эту точку"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
