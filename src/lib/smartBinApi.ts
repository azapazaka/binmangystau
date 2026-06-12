import { normalizeSmartBinBridgeResponse } from "@/lib/smartBinBridge";
import {
  getSmartBinHealthUrl,
  getSmartBinLiveUrl,
  resolveSmartBinRuntimeSource,
} from "@/lib/smartBinSource";
import type { SmartBinBridgeResponse } from "@/types";

function getUnavailableMessage() {
  return resolveSmartBinRuntimeSource() === "cloud"
    ? "Не удалось получить данные из cloud smart-bin API."
    : "Не удалось получить данные от локального bridge.";
}

async function fetchJson(url: string, unavailableMessage: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(unavailableMessage);
  }

  return response.json();
}

export async function getLiveSmartBin(): Promise<SmartBinBridgeResponse> {
  const data = await fetchJson(getSmartBinLiveUrl(), getUnavailableMessage());
  const normalized = normalizeSmartBinBridgeResponse(data);

  if (!normalized) {
    throw new Error("Smart-bin API вернул неожиданный ответ.");
  }

  return normalized;
}

export async function getSmartBinHealth(): Promise<Record<string, unknown>> {
  if (resolveSmartBinRuntimeSource() !== "bridge") {
    return {
      ok: true,
      source: resolveSmartBinRuntimeSource(),
    };
  }

  const data = await fetchJson(
    getSmartBinHealthUrl(),
    "Не удалось получить health от локального bridge.",
  );

  if (!data || typeof data !== "object") {
    throw new Error("Smart-bin health вернул неожиданный ответ.");
  }

  return data as Record<string, unknown>;
}
