import { PassThrough } from "node:stream";

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  maybeSingleMock,
  upsertMock,
  eqMock,
  selectMock,
  fromMock,
  createClientMock,
} = vi.hoisted(() => {
  const maybeSingleMock = vi.fn();
  const upsertMock = vi.fn();
  const eqMock = vi.fn(() => ({
    maybeSingle: maybeSingleMock,
  }));
  const selectMock = vi.fn(() => ({
    eq: eqMock,
  }));
  const fromMock = vi.fn(() => ({
    select: selectMock,
    upsert: upsertMock,
  }));
  const createClientMock = vi.fn(() => ({
    from: fromMock,
  }));

  return {
    maybeSingleMock,
    upsertMock,
    eqMock,
    selectMock,
    fromMock,
    createClientMock,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import liveHandler from "../../api/smart-bin/live";
import pushHandler from "../../api/smart-bin/push";

function createRequest(input: {
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
}) {
  const request = new PassThrough() as PassThrough & {
    method?: string;
    headers: Record<string, string>;
    body?: unknown;
  };

  request.method = input.method;
  request.headers = input.headers ?? {};

  if (input.body !== undefined) {
    request.end(JSON.stringify(input.body));
  } else {
    request.end();
  }

  return request;
}

function createResponse() {
  let body = "";
  const headers: Record<string, string> = {};

  return {
    headers,
    response: {
      statusCode: 200,
      setHeader(name: string, value: string) {
        headers[name] = value;
      },
      end(chunk?: string) {
        body = chunk ?? "";
      },
    },
    json() {
      return JSON.parse(body) as Record<string, unknown>;
    },
  };
}

beforeEach(() => {
  maybeSingleMock.mockReset();
  upsertMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  createClientMock.mockClear();
  process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.SMART_BIN_PUSH_TOKEN = "push-secret";
});

describe("smart-bin api", () => {
  it("returns an offline payload when no cloud state exists yet", async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    });

    const request = createRequest({ method: "GET" });
    const { response, json } = createResponse();

    await liveHandler(request, response as never);

    expect(response.statusCode).toBe(200);
    expect(json()).toMatchObject({
      ok: false,
      error: "Данные smart-bin еще не поступали.",
    });
  });

  it("rejects push without a bearer token", async () => {
    const request = createRequest({
      method: "POST",
      body: { ok: true },
    });
    const { response, json } = createResponse();

    await pushHandler(request, response as never);

    expect(response.statusCode).toBe(401);
    expect(json()).toEqual({
      ok: false,
      error: "Unauthorized",
    });
  });

  it("accepts a valid push and upserts the latest state", async () => {
    upsertMock.mockResolvedValue({ error: null });

    const request = createRequest({
      method: "POST",
      headers: {
        authorization: "Bearer push-secret",
      },
      body: {
        ok: true,
        readAt: "2026-06-11T12:00:00.000Z",
        sections: {
          plastic: {
            distanceCm: 4,
            fillLevel: 73,
            status: "warning",
            isOffline: false,
            lastReadAt: "2026-06-11T12:00:00.000Z",
          },
          organic: {
            distanceCm: null,
            fillLevel: null,
            status: "offline",
            isOffline: true,
            lastReadAt: "2026-06-11T12:00:00.000Z",
          },
        },
        error: null,
        lastParsedFormat: "sensor_log",
      },
    });
    const { response, json } = createResponse();

    await pushHandler(request, response as never);

    expect(response.statusCode).toBe(200);
    expect(json()).toEqual({
      ok: true,
      readAt: "2026-06-11T12:00:00.000Z",
    });
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock.mock.calls[0]?.[0]).toMatchObject({
      id: "smart-bin-live",
      read_at: "2026-06-11T12:00:00.000Z",
      last_parsed_format: "sensor_log",
    });
  });
});
