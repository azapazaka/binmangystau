import { useEffect, useState } from "react";

import { env } from "@/lib/env";
import { getLiveSmartBin } from "@/lib/smartBinApi";
import { createOfflineSmartBinBridgeResponse } from "@/lib/smartBinBridge";
import {
  createEmptyBridgeResponse,
  getSmartBinMaxFillLevel,
  getSmartBinOverallStatus,
  isSmartBinBridgeResponse,
  isSmartBinPosition,
  mergeSmartBinBridgeResponses,
  resolveSmartBinPosition,
  toLiveRecord,
} from "@/lib/smartBin";
import type {
  ClusterRecord,
  SmartBinBridgeResponse,
  SmartBinPosition,
  SmartBinStatus,
} from "@/types";

const POSITION_STORAGE_KEY = "smart-bin:last-position";
const RESPONSE_STORAGE_KEY = "smart-bin:last-response";

function readStoredValue<T>(
  key: string,
  guard: (value: unknown) => value is T,
): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

function mapStatusToClusterStatus(status: SmartBinStatus) {
  if (status === "normal") return "open" as const;
  if (status === "offline") return "closed" as const;
  return "in_progress" as const;
}

function formatCoordinates(position: SmartBinPosition): string {
  return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
}

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Геолокация недоступна в этом браузере."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("Нет доступа к геолокации ноутбука.")),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
}

function toCluster(
  position: SmartBinPosition,
  response: SmartBinBridgeResponse,
): ClusterRecord {
  const liveRecord = toLiveRecord(position, response);
  const priorityScore = getSmartBinMaxFillLevel(liveRecord.sections);
  const overallStatus = getSmartBinOverallStatus(liveRecord.sections);

  return {
    id: liveRecord.id,
    category: "trash",
    effectiveCategory: "trash",
    lat: liveRecord.lat,
    lng: liveRecord.lng,
    address: liveRecord.label,
    district: liveRecord.locationLabel,
    zoneCoefficient: 1,
    reportCount: priorityScore,
    severity: priorityScore,
    priorityScore,
    priorityReason: null,
    topFactors: [],
    prioritySourceReportId: null,
    status: mapStatusToClusterStatus(overallStatus),
    representativePhotoUrl: null,
    aiValidationStatus: "valid",
    effectiveVisualSeverity: null,
    moderatorReviewStatus: "pending",
    createdAt: response.readAt ?? new Date().toISOString(),
    updatedAt: response.readAt ?? new Date().toISOString(),
  };
}

export function useLiveSmartBin() {
  const storedPosition = readStoredValue(POSITION_STORAGE_KEY, isSmartBinPosition);
  const storedResponse = readStoredValue(
    RESPONSE_STORAGE_KEY,
    isSmartBinBridgeResponse,
  );

  const [position, setPosition] = useState<SmartBinPosition>(() =>
    resolveSmartBinPosition({
      storedPosition,
      fallbackPosition: {
        lat: env.defaultLat,
        lng: env.defaultLng,
      },
    }),
  );
  const [bridgeResponse, setBridgeResponse] = useState<SmartBinBridgeResponse>(
    () => storedResponse ?? createEmptyBridgeResponse(),
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(
    storedResponse?.ok ? null : storedResponse?.error ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setRefreshing(true);

    const [geoResult, bridgeResult] = await Promise.allSettled([
      getCurrentPosition(),
      getLiveSmartBin(),
    ]);

    if (geoResult.status === "fulfilled") {
      const nextPosition = resolveSmartBinPosition({
        browserPosition: geoResult.value,
        fallbackPosition: {
          lat: env.defaultLat,
          lng: env.defaultLng,
        },
      });
      setPosition(nextPosition);
      writeStoredValue(POSITION_STORAGE_KEY, nextPosition);
      setGeoError(null);
    } else {
      setPosition((currentPosition) =>
        resolveSmartBinPosition({
          storedPosition:
            currentPosition.source === "browser" ? currentPosition : storedPosition,
          fallbackPosition: {
            lat: env.defaultLat,
            lng: env.defaultLng,
          },
        }),
      );
      setGeoError(
        geoResult.reason instanceof Error
          ? geoResult.reason.message
          : "Не удалось определить геолокацию.",
      );
    }

    if (bridgeResult.status === "fulfilled") {
      setBridgeResponse((previous) => {
        const merged = mergeSmartBinBridgeResponses(previous, bridgeResult.value);
        writeStoredValue(RESPONSE_STORAGE_KEY, merged);
        return merged;
      });
      setBridgeError(
        bridgeResult.value.ok
          ? null
          : bridgeResult.value.error ?? "Нет данных от ESP32.",
      );
    } else {
      const message =
        bridgeResult.reason instanceof Error
          ? bridgeResult.reason.message
          : "Не удалось получить данные от ESP32.";
      setBridgeResponse((previous) =>
        createOfflineSmartBinBridgeResponse({
          error: message,
          previousSections: previous.sections,
          readAt: previous.readAt,
        }),
      );
      setBridgeError(message);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const record = toLiveRecord(position, bridgeResponse);
  const cluster = toCluster(position, bridgeResponse);

  return {
    bridgeError,
    bridgeOk: bridgeResponse.ok,
    cluster,
    coordinatesLabel: formatCoordinates(position),
    geoError,
    loading,
    position,
    record,
    refresh,
    refreshing,
  };
}
