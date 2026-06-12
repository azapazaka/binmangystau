import type { IncomingMessage, ServerResponse } from "node:http";

import { readSmartBinLiveState, sendJson } from "../_lib/smart-bin-server.ts";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readSmartBinLiveState();
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось прочитать cloud smart-bin state.",
    });
  }
}
