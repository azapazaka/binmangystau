import { env } from "@/lib/env";
import type { SmartBinRuntimeSource } from "@/types";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const SMART_BIN_SOURCE_QUERY_PARAM = "smartBinSource";

function isSmartBinRuntimeSource(
  value: unknown,
): value is SmartBinRuntimeSource {
  return value === "legacy" || value === "bridge" || value === "cloud";
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function isVercelPreviewHostname(hostname: string): boolean {
  return hostname.endsWith(".vercel.app") && hostname.includes("-git-");
}

export function normalizeSmartBinRuntimeSource(
  value: unknown,
): SmartBinRuntimeSource | null {
  return isSmartBinRuntimeSource(value) ? value : null;
}

export function resolveDefaultSmartBinRuntimeSource(
  hostname?: string,
): SmartBinRuntimeSource {
  if (hostname !== undefined) {
    if (LOCAL_HOSTS.has(hostname)) return "bridge";
    if (isVercelPreviewHostname(hostname)) return "cloud";
    return "legacy";
  }

  if (
    typeof window !== "undefined" &&
    LOCAL_HOSTS.has(window.location.hostname)
  ) {
    return "bridge";
  }

  if (
    typeof window !== "undefined" &&
    isVercelPreviewHostname(window.location.hostname)
  ) {
    return "cloud";
  }

  return "legacy";
}

export function resolveSmartBinRuntimeSourceOverride(): SmartBinRuntimeSource | null {
  if (typeof window === "undefined") return null;

  return normalizeSmartBinRuntimeSource(
    new URLSearchParams(window.location.search).get(
      SMART_BIN_SOURCE_QUERY_PARAM,
    ),
  );
}

export function resolveSmartBinRuntimeSource(
  hostname?: string,
): SmartBinRuntimeSource {
  return (
    resolveSmartBinRuntimeSourceOverride() ??
    normalizeSmartBinRuntimeSource(env.smartBinSource) ??
    resolveDefaultSmartBinRuntimeSource(hostname)
  );
}

export function getSmartBinBridgeBaseUrl(): string {
  return trimTrailingSlash(env.smartBinBridgeUrl);
}

export function getSmartBinCloudLiveUrl(): string {
  return env.smartBinCloudUrl;
}

export function getSmartBinLiveUrl(
  source = resolveSmartBinRuntimeSource(),
): string {
  if (source === "bridge") {
    return `${getSmartBinBridgeBaseUrl()}/live-bin`;
  }

  if (source === "cloud") {
    return getSmartBinCloudLiveUrl();
  }

  throw new Error("В legacy-режиме live-источник не используется.");
}

export function getSmartBinHealthUrl(): string {
  return `${getSmartBinBridgeBaseUrl()}/health`;
}
