import type { IncomingMessage, ServerResponse } from "node:http";

import {
  isAuthorizedPushRequest,
  normalizeIncomingSmartBinPayload,
  readRequestJson,
  sendJson,
  upsertSmartBinLiveState,
} from "../_lib/smart-bin-server.js";

type PushRequest = IncomingMessage & { body?: unknown };

export default async function handler(
  request: PushRequest,
  response: ServerResponse,
) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!isAuthorizedPushRequest(request)) {
    sendJson(response, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const body = await readRequestJson(request);
    const payload = normalizeIncomingSmartBinPayload(body);

    if (!payload) {
      sendJson(response, 422, { ok: false, error: "Invalid smart-bin payload" });
      return;
    }

    await upsertSmartBinLiveState(payload);
    sendJson(response, 200, { ok: true, readAt: payload.readAt });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось сохранить cloud smart-bin state.",
    });
  }
}
