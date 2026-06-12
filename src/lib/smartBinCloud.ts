import type { SmartBinBridgeResponse } from "../types";

export type SmartBinPushResult = {
  attempted: boolean;
  ok: boolean;
  pushedAt: string | null;
  error: string | null;
};

export async function pushSmartBinCloudState(input: {
  fetchImpl?: typeof fetch;
  pushUrl: string | null;
  pushToken: string | null;
  payload: SmartBinBridgeResponse;
}): Promise<SmartBinPushResult> {
  const { fetchImpl = fetch, pushUrl, pushToken, payload } = input;

  if (!pushUrl || !pushToken) {
    return {
      attempted: false,
      ok: false,
      pushedAt: null,
      error: null,
    };
  }

  try {
    const response = await fetchImpl(pushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pushToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      attempted: true,
      ok: true,
      pushedAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      pushedAt: null,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось отправить smart-bin данные в cloud.",
    };
  }
}
