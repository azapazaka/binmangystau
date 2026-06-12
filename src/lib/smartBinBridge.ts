import type {
  SmartBinBridgeResponse,
  SmartBinBridgeSections,
} from "../types/index.js";
import {
  createBridgeSectionFromDistance,
  createEmptyBridgeResponse,
  createOfflineBridgeSection,
  isSmartBinBridgeResponse,
} from "./smartBin.js";

export type SmartBinSerialPayload = {
  plasticDistanceCm: number | null;
  organicDistanceCm: number | null;
};

function toNullableDistance(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseSmartBinSerialLine(
  line: string,
): SmartBinSerialPayload | null {
  try {
    const parsed = JSON.parse(line) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    const legacyPayload = {
      plasticDistanceCm: toNullableDistance(parsed.plasticDistanceCm),
      organicDistanceCm: toNullableDistance(parsed.organicDistanceCm),
    };

    if (
      legacyPayload.plasticDistanceCm != null ||
      legacyPayload.organicDistanceCm != null
    ) {
      return legacyPayload;
    }

    const hcSr04Ok =
      typeof parsed.hc_sr04_ok === "boolean" ? parsed.hc_sr04_ok : undefined;
    const us016Ok =
      typeof parsed.us016_ok === "boolean" ? parsed.us016_ok : undefined;
    const hubPayload = {
      plasticDistanceCm:
        hcSr04Ok === false ? null : toNullableDistance(parsed.hc_sr04_cm),
      organicDistanceCm:
        us016Ok === false ? null : toNullableDistance(parsed.us016_cm),
    };

    if (
      hubPayload.plasticDistanceCm == null &&
      hubPayload.organicDistanceCm == null
    ) {
      return null;
    }

    return hubPayload;
  } catch {
    return null;
  }
}

export function isSmartBinSensorLogTerminator(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "" || /^=+$/.test(trimmed);
}

export function parseSmartBinSensorLogBlock(
  lines: string[],
): SmartBinSerialPayload | null {
  let plasticDistanceCm: number | null | undefined;
  let organicDistanceCm: number | null | undefined;
  let sawRelevantLine = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const hcsr04Match = line.match(/^HC-SR04 Distance:\s*([-+]?\d*\.?\d+)\s*cm$/i);
    if (hcsr04Match) {
      plasticDistanceCm = Number(hcsr04Match[1]);
      sawRelevantLine = true;
      continue;
    }

    if (/^HC-SR04:\s*no echo \/ out of range$/i.test(line)) {
      plasticDistanceCm = null;
      sawRelevantLine = true;
      continue;
    }

    const us016Match = line.match(/^US-016 Distance:\s*([-+]?\d*\.?\d+)\s*cm$/i);
    if (us016Match) {
      organicDistanceCm = Number(us016Match[1]);
      sawRelevantLine = true;
    }
  }

  const hasValidDistance =
    (typeof plasticDistanceCm === "number" && Number.isFinite(plasticDistanceCm)) ||
    (typeof organicDistanceCm === "number" && Number.isFinite(organicDistanceCm));

  if (!sawRelevantLine || !hasValidDistance) {
    return null;
  }

  return {
    plasticDistanceCm:
      typeof plasticDistanceCm === "number" ? plasticDistanceCm : null,
    organicDistanceCm:
      typeof organicDistanceCm === "number" ? organicDistanceCm : null,
  };
}

export function buildSmartBinBridgeResponse(
  payload: SmartBinSerialPayload,
  readAt = new Date().toISOString(),
): SmartBinBridgeResponse {
  return {
    ok: true,
    readAt,
    sections: {
      plastic: createBridgeSectionFromDistance(
        payload.plasticDistanceCm,
        readAt,
      ),
      organic: createBridgeSectionFromDistance(
        payload.organicDistanceCm,
        readAt,
      ),
    },
    error: null,
    lastParsedFormat: null,
  };
}

export function createOfflineSmartBinBridgeResponse(input?: {
  error?: string | null;
  previousSections?: SmartBinBridgeSections | null;
  readAt?: string | null;
}): SmartBinBridgeResponse {
  const fallback = createEmptyBridgeResponse(input?.error ?? "Нет данных от ESP32.");
  const previousSections = input?.previousSections;
  if (!previousSections) {
    return {
      ...fallback,
      readAt: input?.readAt ?? null,
    };
  }

  return {
    ok: false,
    readAt: input?.readAt ?? null,
    sections: {
      plastic: createOfflineBridgeSection(previousSections.plastic),
      organic: createOfflineBridgeSection(previousSections.organic),
    },
    error: input?.error ?? "Нет данных от ESP32.",
    lastParsedFormat: null,
  };
}

export function normalizeSmartBinBridgeResponse(
  value: unknown,
): SmartBinBridgeResponse | null {
  if (!isSmartBinBridgeResponse(value)) return null;

  return {
    ok: value.ok,
    readAt: value.readAt,
    sections: value.sections,
    error: value.error ?? null,
    lastParsedFormat: value.lastParsedFormat ?? null,
  };
}

export type { SmartBinSerialFormat } from "../types/index.js";
