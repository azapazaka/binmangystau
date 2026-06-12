import type {
  SmartBinBridgeResponse,
  SmartBinBridgeSectionPayload,
  SmartBinBridgeSections,
  SmartBinLiveRecord,
  SmartBinLiveSection,
  SmartBinPosition,
  SmartBinSerialFormat,
  SmartBinSectionKey,
  SmartBinStatus,
} from "../types";

export const SMART_BIN_HEIGHT_CM = 15;
export const SMART_BIN_SECTION_KEYS = ["plastic", "organic"] as const;
export const SMART_BIN_LABELS: Record<SmartBinSectionKey, string> = {
  plastic: "Пластик",
  organic: "Органика",
};

const SMART_BIN_STATUS_PRIORITY: Record<SmartBinStatus, number> = {
  offline: -1,
  normal: 0,
  warning: 1,
  full: 2,
  fire: 3,
  sos: 4,
};

const FALLBACK_BIN_ID = "smart-bin-live";
const FALLBACK_BIN_LABEL = "Умная мусорка";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSmartBinStatus(value: unknown): value is SmartBinStatus {
  return (
    value === "normal" ||
    value === "warning" ||
    value === "full" ||
    value === "fire" ||
    value === "sos" ||
    value === "offline"
  );
}

function isSmartBinSerialFormat(value: unknown): value is SmartBinSerialFormat {
  return value === "json" || value === "sensor_log";
}

function isSmartBinSectionKey(value: unknown): value is SmartBinSectionKey {
  return value === "plastic" || value === "organic";
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateFillLevel(
  distanceCm: number,
  heightCm = SMART_BIN_HEIGHT_CM,
): number {
  return clampNumber(
    Math.round(((heightCm - distanceCm) / heightCm) * 100),
    0,
    100,
  );
}

export function getSmartBinStatusFromFillLevel(fillLevel: number): SmartBinStatus {
  if (fillLevel >= 80) return "full";
  if (fillLevel >= 50) return "warning";
  return "normal";
}

export function createOfflineBridgeSection(
  previous?: Partial<SmartBinBridgeSectionPayload>,
): SmartBinBridgeSectionPayload {
  return {
    distanceCm: previous?.distanceCm ?? null,
    fillLevel: previous?.fillLevel ?? null,
    status: "offline",
    isOffline: true,
    lastReadAt: previous?.lastReadAt ?? null,
  };
}

export function createBridgeSectionFromDistance(
  distanceCm: number | null,
  readAt: string | null,
): SmartBinBridgeSectionPayload {
  if (distanceCm == null) {
    return createOfflineBridgeSection({ lastReadAt: readAt });
  }

  const fillLevel = calculateFillLevel(distanceCm);

  return {
    distanceCm,
    fillLevel,
    status: getSmartBinStatusFromFillLevel(fillLevel),
    isOffline: false,
    lastReadAt: readAt,
  };
}

export function createEmptyBridgeSections(): SmartBinBridgeSections {
  return {
    plastic: createOfflineBridgeSection(),
    organic: createOfflineBridgeSection(),
  };
}

export function createEmptyBridgeResponse(
  error: string | null = "Нет данных от ESP32.",
): SmartBinBridgeResponse {
  return {
    ok: false,
    readAt: null,
    sections: createEmptyBridgeSections(),
    error,
  };
}

export function mergeSmartBinBridgeResponses(
  previous: SmartBinBridgeResponse,
  incoming: SmartBinBridgeResponse,
): SmartBinBridgeResponse {
  const sections = SMART_BIN_SECTION_KEYS.reduce((acc, key) => {
    const nextSection = incoming.sections[key];
    const prevSection = previous.sections[key];
    const shouldPreserveLastValue =
      nextSection.isOffline &&
      nextSection.fillLevel == null &&
      nextSection.distanceCm == null &&
      (prevSection.fillLevel != null || prevSection.distanceCm != null);

    acc[key] = shouldPreserveLastValue
      ? createOfflineBridgeSection(prevSection)
      : nextSection;
    return acc;
  }, {} as SmartBinBridgeSections);

  return {
    ok: incoming.ok,
    readAt: incoming.ok ? incoming.readAt : previous.readAt ?? incoming.readAt,
    sections,
    error: incoming.error ?? null,
    lastParsedFormat: incoming.lastParsedFormat ?? previous.lastParsedFormat ?? null,
  };
}

export function toLiveSection(
  wasteType: SmartBinSectionKey,
  payload: SmartBinBridgeSectionPayload,
): SmartBinLiveSection {
  return {
    wasteType,
    distanceCm: payload.distanceCm,
    fillLevel: payload.fillLevel,
    status: payload.status,
    isOffline: payload.isOffline,
    lastReadAt: payload.lastReadAt,
  };
}

export function toLiveRecord(
  position: SmartBinPosition,
  bridgeResponse: SmartBinBridgeResponse,
): SmartBinLiveRecord {
  return {
    id: FALLBACK_BIN_ID,
    label: FALLBACK_BIN_LABEL,
    lat: position.lat,
    lng: position.lng,
    locationSource: position.source,
    locationLabel: formatLocationLabel(position),
    sections: {
      plastic: toLiveSection("plastic", bridgeResponse.sections.plastic),
      organic: toLiveSection("organic", bridgeResponse.sections.organic),
    },
    lastUpdatedAt: bridgeResponse.readAt,
  };
}

export function getSmartBinMaxFillLevel(
  sections: Record<SmartBinSectionKey, Pick<SmartBinLiveSection, "fillLevel">>,
): number {
  return Math.max(
    ...SMART_BIN_SECTION_KEYS.map((key) => sections[key].fillLevel ?? 0),
  );
}

export function getSmartBinOverallStatus(
  sections: Record<
    SmartBinSectionKey,
    Pick<SmartBinLiveSection, "status" | "isOffline">
  >,
): SmartBinStatus {
  const onlineStatuses = SMART_BIN_SECTION_KEYS
    .map((key) => sections[key])
    .filter((section) => !section.isOffline)
    .map((section) => section.status);

  if (onlineStatuses.length === 0) {
    return "offline";
  }

  return onlineStatuses.reduce((highest, current) =>
    SMART_BIN_STATUS_PRIORITY[current] > SMART_BIN_STATUS_PRIORITY[highest]
      ? current
      : highest,
  );
}

export function resolveSmartBinPosition(input: {
  browserPosition?: { lat: number; lng: number } | null;
  storedPosition?: SmartBinPosition | null;
  fallbackPosition: { lat: number; lng: number };
}): SmartBinPosition {
  if (input.browserPosition) {
    return {
      lat: input.browserPosition.lat,
      lng: input.browserPosition.lng,
      source: "browser",
    };
  }

  if (input.storedPosition) {
    return input.storedPosition;
  }

  return {
    lat: input.fallbackPosition.lat,
    lng: input.fallbackPosition.lng,
    source: "default",
  };
}

export function formatLocationLabel(position: SmartBinPosition): string {
  if (position.source === "browser") return "Геолокация ноутбука";
  if (position.source === "stored") return "Последняя известная точка";
  return "Точка по умолчанию";
}

export function isSmartBinPosition(value: unknown): value is SmartBinPosition {
  return (
    isObject(value) &&
    isFiniteNumber(value.lat) &&
    isFiniteNumber(value.lng) &&
    (value.source === "browser" ||
      value.source === "stored" ||
      value.source === "default")
  );
}

export function isSmartBinBridgeSectionPayload(
  value: unknown,
): value is SmartBinBridgeSectionPayload {
  return (
    isObject(value) &&
    (value.distanceCm === null || isFiniteNumber(value.distanceCm)) &&
    (value.fillLevel === null || isFiniteNumber(value.fillLevel)) &&
    isSmartBinStatus(value.status) &&
    typeof value.isOffline === "boolean" &&
    (value.lastReadAt === null || typeof value.lastReadAt === "string")
  );
}

export function isSmartBinBridgeSections(
  value: unknown,
): value is SmartBinBridgeSections {
  return (
    isObject(value) &&
    SMART_BIN_SECTION_KEYS.every((key) =>
      isSmartBinBridgeSectionPayload(value[key]),
    )
  );
}

export function isSmartBinBridgeResponse(
  value: unknown,
): value is SmartBinBridgeResponse {
  return (
    isObject(value) &&
    typeof value.ok === "boolean" &&
    (value.readAt === null || typeof value.readAt === "string") &&
    isSmartBinBridgeSections(value.sections) &&
    (value.error === undefined ||
      value.error === null ||
      typeof value.error === "string") &&
    (value.lastParsedFormat === undefined ||
      value.lastParsedFormat === null ||
      isSmartBinSerialFormat(value.lastParsedFormat))
  );
}

export function isSmartBinLiveRecord(value: unknown): value is SmartBinLiveRecord {
  if (!isObject(value) || !isObject(value.sections)) {
    return false;
  }

  const sections = value.sections;

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isFiniteNumber(value.lat) &&
    isFiniteNumber(value.lng) &&
    (value.locationSource === "browser" ||
      value.locationSource === "stored" ||
      value.locationSource === "default") &&
    typeof value.locationLabel === "string" &&
    SMART_BIN_SECTION_KEYS.every((key) => {
      const section = sections[key];
      return (
        isObject(section) &&
        isSmartBinSectionKey(section.wasteType) &&
        (section.distanceCm === null || isFiniteNumber(section.distanceCm)) &&
        (section.fillLevel === null || isFiniteNumber(section.fillLevel)) &&
        isSmartBinStatus(section.status) &&
        typeof section.isOffline === "boolean" &&
        (section.lastReadAt === null || typeof section.lastReadAt === "string")
      );
    }) &&
    (value.lastUpdatedAt === null || typeof value.lastUpdatedAt === "string")
  );
}
