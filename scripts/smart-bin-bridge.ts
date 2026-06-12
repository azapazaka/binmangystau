import http from "node:http";

import { SerialPort } from "serialport";

import {
  buildSmartBinBridgeResponse,
  createOfflineSmartBinBridgeResponse,
  isSmartBinSensorLogTerminator,
  parseSmartBinSerialLine,
  parseSmartBinSensorLogBlock,
  type SmartBinSerialFormat,
} from "../src/lib/smartBinBridge.ts";
import { pushSmartBinCloudState } from "../src/lib/smartBinCloud.ts";
import type { SmartBinBridgeResponse } from "../src/types/index.ts";

const BRIDGE_PORT = Number(process.env.BRIDGE_PORT ?? 8787);
const BAUD_RATE = Number(process.env.ESP32_BAUD_RATE ?? 115200);
const SERIAL_OVERRIDE = process.env.ESP32_SERIAL_PORT?.trim() || null;
const SMART_BIN_PUSH_URL = process.env.SMART_BIN_PUSH_URL?.trim() || null;
const SMART_BIN_PUSH_TOKEN = process.env.SMART_BIN_PUSH_TOKEN?.trim() || null;

type SerialState = {
  connected: boolean;
  portPath: string | null;
  lastReadAt: string | null;
  error: string | null;
  lastParsedFormat: SmartBinSerialFormat | null;
  lastRawLine: string | null;
};

type PushState = {
  enabled: boolean;
  lastPushAt: string | null;
  lastPushError: string | null;
};

let serialBuffer = "";
let sensorLogBlock: string[] = [];
let reconnectTimer: NodeJS.Timeout | null = null;
let port: SerialPort | null = null;
let latestResponse: SmartBinBridgeResponse = createOfflineSmartBinBridgeResponse({
  error: "Ожидание данных от ESP32.",
});
let serialState: SerialState = {
  connected: false,
  portPath: null,
  lastReadAt: null,
  error: "Serial-порт еще не подключен.",
  lastParsedFormat: null,
  lastRawLine: null,
};
let pushState: PushState = {
  enabled: Boolean(SMART_BIN_PUSH_URL && SMART_BIN_PUSH_TOKEN),
  lastPushAt: null,
  lastPushError: null,
};

function withCorsHeaders(response: http.ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  withCorsHeaders(response);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectSerial();
  }, 2500);
}

function getPortScore(portInfo: Awaited<ReturnType<typeof SerialPort.list>>[number]) {
  const haystack = [
    portInfo.path,
    portInfo.manufacturer,
    portInfo.friendlyName,
    portInfo.serialNumber,
    portInfo.pnpId,
    portInfo.vendorId,
    portInfo.productId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/esp32|cp210|wch|ch340|usb|acm|uart/.test(haystack)) return 3;
  if (/serial|tty|com/.test(haystack)) return 2;
  return 1;
}

async function resolvePortPath(): Promise<string | null> {
  if (SERIAL_OVERRIDE) return SERIAL_OVERRIDE;

  const ports = await SerialPort.list();
  if (ports.length === 0) return null;

  const sorted = [...ports].sort((a, b) => getPortScore(b) - getPortScore(a));
  return sorted[0]?.path ?? null;
}

function markSerialOffline(error: string) {
  serialState = {
    ...serialState,
    connected: false,
    error,
  };
  latestResponse = createOfflineSmartBinBridgeResponse({
    error,
    previousSections: latestResponse.sections,
    readAt: latestResponse.readAt,
  });
}

function publishParsedPayload(
  payload: ReturnType<typeof parseSmartBinSerialLine>,
  format: SmartBinSerialFormat,
  rawLine: string,
) {
  if (!payload) return;

  latestResponse = {
    ...buildSmartBinBridgeResponse(payload),
    lastParsedFormat: format,
  };
  serialState = {
    connected: true,
    portPath: port?.path ?? serialState.portPath,
    lastReadAt: latestResponse.readAt,
    error: null,
    lastParsedFormat: format,
    lastRawLine: rawLine,
  };

  void uploadLatestResponse(latestResponse);
}

async function uploadLatestResponse(response: SmartBinBridgeResponse) {
  const result = await pushSmartBinCloudState({
    pushUrl: SMART_BIN_PUSH_URL,
    pushToken: SMART_BIN_PUSH_TOKEN,
    payload: response,
  });

  if (!result.attempted) {
    return;
  }

  pushState = {
    ...pushState,
    lastPushAt: result.ok ? result.pushedAt : pushState.lastPushAt,
    lastPushError: result.error,
  };
}

function handleSerialLine(line: string) {
  const trimmed = line.trim();
  serialState = {
    ...serialState,
    lastRawLine: trimmed || serialState.lastRawLine,
  };

  if (trimmed.length === 0 || isSmartBinSensorLogTerminator(trimmed)) {
    const sensorLogPayload = parseSmartBinSensorLogBlock(sensorLogBlock);
    if (sensorLogPayload) {
      publishParsedPayload(
        sensorLogPayload,
        "sensor_log",
        sensorLogBlock.join(" | "),
      );
    }
    sensorLogBlock = [];
    return;
  }

  const jsonPayload = parseSmartBinSerialLine(trimmed);
  if (jsonPayload) {
    sensorLogBlock = [];
    publishParsedPayload(jsonPayload, "json", trimmed);
    return;
  }

  sensorLogBlock.push(trimmed);
}

function attachSerialListeners(activePort: SerialPort) {
  activePort.on("data", (chunk: Buffer<ArrayBufferLike>) => {
    serialBuffer += chunk.toString("utf8");
    const lines = serialBuffer.split(/\r?\n/);
    serialBuffer = lines.pop() ?? "";

    for (const line of lines) {
      handleSerialLine(line.trim());
    }
  });

  activePort.on("error", (error) => {
    markSerialOffline(`Ошибка serial: ${error.message}`);
    scheduleReconnect();
  });

  activePort.on("close", () => {
    markSerialOffline("ESP32 отключен от serial-порта.");
    scheduleReconnect();
  });
}

async function connectSerial() {
  try {
    const path = await resolvePortPath();
    if (!path) {
      markSerialOffline("Не найден подходящий serial-порт для ESP32.");
      scheduleReconnect();
      return;
    }

    if (port?.isOpen) {
      return;
    }

    port = new SerialPort({
      path,
      baudRate: BAUD_RATE,
      autoOpen: false,
    });

    await new Promise<void>((resolve, reject) => {
      port?.open((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    serialState = {
      connected: true,
      portPath: path,
      lastReadAt: latestResponse.readAt,
      error: null,
      lastParsedFormat: serialState.lastParsedFormat,
      lastRawLine: serialState.lastRawLine,
    };
    attachSerialListeners(port);
  } catch (error) {
    markSerialOffline(
      error instanceof Error
        ? `Не удалось подключиться к ESP32: ${error.message}`
        : "Не удалось подключиться к ESP32.",
    );
    scheduleReconnect();
  }
}

const server = http.createServer((request, response) => {
  if (!request.url) {
    sendJson(response, 404, { ok: false, error: "Not found" });
    return;
  }

  if (request.method === "OPTIONS") {
    withCorsHeaders(response);
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (request.url === "/health") {
    sendJson(response, 200, {
      ok: true,
      serial: serialState,
      push: pushState,
      lastParsedFormat: serialState.lastParsedFormat,
      lastRawLine: serialState.lastRawLine,
      bridgePort: BRIDGE_PORT,
    });
    return;
  }

  if (request.url === "/live-bin") {
    sendJson(response, 200, latestResponse);
    return;
  }

  sendJson(response, 404, { ok: false, error: "Not found" });
});

server.listen(BRIDGE_PORT, () => {
  console.log(`Smart bin bridge listening on http://localhost:${BRIDGE_PORT}`);
});

void connectSerial();
