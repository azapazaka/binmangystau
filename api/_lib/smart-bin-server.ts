import type { IncomingMessage, ServerResponse } from "node:http";

import { createClient } from "@supabase/supabase-js";

import {
  createOfflineSmartBinBridgeResponse,
  normalizeSmartBinBridgeResponse,
} from "../../src/lib/smartBinBridge.ts";
import type { SmartBinBridgeResponse } from "../../src/types/index.ts";

const SMART_BIN_LIVE_STATE_ID = "smart-bin-live";

type SmartBinLiveStateRow = {
  payload: SmartBinBridgeResponse | null;
  read_at: string | null;
  last_parsed_format: SmartBinBridgeResponse["lastParsedFormat"];
};

function getSupabaseUrl() {
  return (
    process.env.VITE_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  );
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export function getPushToken() {
  return process.env.SMART_BIN_PUSH_TOKEN?.trim() || "";
}

export function isAuthorizedPushRequest(request: IncomingMessage) {
  const expectedToken = getPushToken();
  const header = request.headers.authorization;
  const actualToken =
    typeof header === "string" && header.startsWith("Bearer ")
      ? header.slice("Bearer ".length).trim()
      : "";

  return Boolean(expectedToken && actualToken && actualToken === expectedToken);
}

export async function readRequestJson(
  request: IncomingMessage & { body?: unknown },
): Promise<unknown> {
  if (request.body !== undefined) {
    return request.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return null;
  }

  return JSON.parse(rawBody) as unknown;
}

export function normalizeIncomingSmartBinPayload(
  value: unknown,
): SmartBinBridgeResponse | null {
  const normalized = normalizeSmartBinBridgeResponse(value);

  if (!normalized || !normalized.ok || !normalized.readAt) {
    return null;
  }

  return normalized;
}

export function createSupabaseAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server env is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function readSmartBinLiveState(): Promise<SmartBinBridgeResponse> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("smart_bin_live_state")
    .select("payload, read_at, last_parsed_format")
    .eq("id", SMART_BIN_LIVE_STATE_ID)
    .maybeSingle<SmartBinLiveStateRow>();

  if (error) {
    throw new Error(error.message);
  }

  const normalized = normalizeSmartBinBridgeResponse(data?.payload);
  if (!normalized) {
    return createOfflineSmartBinBridgeResponse({
      error: "Данные smart-bin еще не поступали.",
    });
  }

  return {
    ...normalized,
    readAt: data?.read_at ?? normalized.readAt,
    lastParsedFormat:
      data?.last_parsed_format ?? normalized.lastParsedFormat ?? null,
  };
}

export async function upsertSmartBinLiveState(payload: SmartBinBridgeResponse) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("smart_bin_live_state").upsert(
    {
      id: SMART_BIN_LIVE_STATE_ID,
      payload,
      read_at: payload.readAt,
      updated_at: new Date().toISOString(),
      last_parsed_format: payload.lastParsedFormat ?? null,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
